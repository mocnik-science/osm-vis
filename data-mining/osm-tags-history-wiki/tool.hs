{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE OverloadedStrings #-}

import Chorale.Common
import Control.Applicative (empty)
import Control.Monad
import Data.Aeson hiding (Result)
import Data.Aeson.Types hiding (Result)
import qualified Data.ByteString.Lazy.Char8 as C
import Data.Char (isSpace, toLower)
import qualified Data.HashMap.Strict as H
import Data.List
import Data.Maybe
import Data.Ord
import Data.Time
import qualified Data.Vector as V
import GHC.Generics
import Network.Curl
import Safe
import Text.HTML.Scalpel

urlWikiBase :: String
urlWikiBase = "https://wiki.openstreetmap.org"
urlWikiPrefix :: String
urlWikiPrefix = "/wiki/"
urlWikiOverview :: String
urlWikiOverview = urlWikiBase ++ urlWikiPrefix ++ "Map_Features"
urlWikiKeyValue :: String -> String -> String
urlWikiKeyValue k v = urlWikiPrefix ++ "Tag:" ++ k ++ "%3D" ++ v
urlWikiHistory :: String -> String
urlWikiHistory url = urlWikiBase ++ "/w/api.php?action=query&format=json&titles=" ++ url ++ "&prop=revisions&rvprop=timestamp|ids|content&rvlimit=500&continue="
urlWikiHistorySuffix :: String
urlWikiHistorySuffix = "&rvstartid="
outputFile :: String
outputFile = "../../data/osm-tags-history-wiki.json"
descriptionKeys :: [String]
descriptionKeys = ["key", "value", "status", "description", "onNode", "onWay", "onArea"]

dataDescription' :: String
dataDescription' = "Tag history from the OpenStreetMap wiki"
dataSource' :: String
dataSource' = "OpenStreetMap project, <a href=\"http://wiki.openstreetmap.org/wiki/Wiki_content_license\" target=\"_blank\">CC BY-SA 2.0</a>"

-- --== MAIN

main :: IO ()
main = do
    descriptionHistory' <- filter (not . null . value) . filter (not . null . key) . catMaybes <$> (mapM (urlToDescriptionHistory 1 detectAllDifferences) =<< listOfTagUrls urlWikiOverview)
    timestamp' <- formatTime defaultTimeLocale "%Y-%m-%dT%H:%M:%S%Z" <$> getCurrentTime
    C.writeFile outputFile . encode $ Result timestamp' dataDescription' dataSource' urlWikiOverview descriptionHistory'

-- --== RESULT

data Result = Result {dataTimestamp :: String, dataDescription :: String, dataSource :: String, dataUrl :: String, descriptionHistory :: [DescriptionHistory Int]} deriving Generic

instance ToJSON Result where
    toEncoding = genericToEncoding defaultOptions

-- --== COMPARISON OF DESCRIPTION

detectAllDifferences :: Description -> Description -> Maybe Int
detectAllDifferences dOld dNew
    | (mapJust (map toLower) . lookup "status") dNew == Just "deprecated" = Just (-1)
    | uncurry (/=) . map12 sort $ (dOld, dNew) = Just 1
    | otherwise = Nothing

-- --== EXTRACT TAGS

listOfTagUrls :: URL -> IO [URL]
listOfTagUrls = fmap nubOrd . uncurry (liftM2 (++)) . map21 (findHardcoded, findByTaglists) where
    findHardcoded = fmap (filter (uncurry (||) . map21 (isKeyURL, isTagURL)) . fromMaybe []) .* flip scrapeURL . attrs "href" $ "a"
    findByTaglists = fmap (nubOrd . map (uncurry urlWikiKeyValue) . concatMap (findTags "" []) . fromMaybe []) .* flip scrapeURL . attrs "data-taginfo-taglist-tags" $ "div"
    findTags lastKey ls x
        | isNothing remainder = ls'
        | otherwise = findTags (fst . head $ ls') ls' (fromJust remainder) where
            (current, remainder) = splitOnFirst ',' x
            (current1, current2) = splitOnFirst '=' current
            ls'
                | isNothing current2 = (lastKey, current1):ls
                | otherwise = (current1, fromJust current2):ls

isTemplate :: URL -> Bool
isTemplate = isPrefixOf (urlWikiPrefix ++ "template:map_features:") . map toLower

isKeyURL :: URL -> Bool
isKeyURL = isPrefixOf (urlWikiPrefix ++ "key:") . map toLower

isTagURL :: URL -> Bool
isTagURL = isPrefixOf (urlWikiPrefix ++ "tag:") . map toLower

-- --== EXTRACT DESCRIPTION

type Description = [(String, String)]
data DescriptionHistory v = DescriptionHistory {
    key :: String,
    value :: String,
    history :: [(String, v)]
} deriving (Generic, Show)

instance ToJSON v => ToJSON (DescriptionHistory v) where
    toEncoding = genericToEncoding defaultOptions

data Revision = Revision {
    revid :: Int,
    parentid :: Int,
    timestamp :: String,
    description :: [(String, String)]
} deriving (Generic, Show)

instance FromJSON Revision where
    parseJSON (Object r) = Revision <$>
        r .: "revid" <*>
        r .: "parentid" <*>
        r .: "timestamp" <*>
        fmap parseDescription (r .: "*")
    parseJSON _ = empty

urlToDescriptionHistory :: v -> (Description -> Description -> Maybe v) -> String -> IO (Maybe (DescriptionHistory v))
urlToDescriptionHistory value' compareDescriptions s = revisionsToDescriptionHistory value' compareDescriptions <$> revisions s where
    revisions s' = do
        rs <- descriptionStringToRevisions <$> urlToDescriptionString s'
        if length rs > 1 then do
            rs' <- revisions (s ++ urlWikiHistorySuffix ++ (show . revid . last) rs)
            return $ rs ++ rs'
        else return rs

urlToDescriptionString :: URL -> IO String
urlToDescriptionString = fmap snd . flip curlGetString [] . urlWikiHistory . fromMaybe "" . stripPrefix urlWikiPrefix

parseDescription :: String -> Description
parseDescription string = map (mapSnd fromJust) . filter (isJust . snd) . map (map21 (id, flip getValueForKey string)) $ descriptionKeys

getValueForKey :: String -> String -> Maybe String
getValueForKey key' = headMay . map (trim . tail . snd) . filter (\(x, y) -> x == "|" ++ key' && (not . null) y && head y == '=') . map (map22 (filter (/= ' '), trim) . break (== '=')) . lines where
    trim = dropWhile isSpace . reverse . dropWhile isSpace . reverse

descriptionStringToRevisions :: String -> [Revision]
descriptionStringToRevisions s = concat . maybeToList $ parseToArray =<< getValueFor "revisions" =<< getFirstValue =<< getValueFor "pages" =<< getValueFor "query" =<< (decode . C.pack) s where
    onlyObject f = \case
        Object x -> f x
        _ -> Nothing
    getValueFor = onlyObject . H.lookup
    getFirstValue = onlyObject $ mapJust snd . headMay . H.toList
    parseToArray = \case
        Array x -> mapM parseToRevision . V.toList $ x
        _ -> Nothing
    parseToRevision = onlyObject $ parseMaybe parseJSON . Object

revisionsToDescriptionHistory :: v -> (Description -> Description -> Maybe v) -> [Revision] -> Maybe (DescriptionHistory v)
revisionsToDescriptionHistory defaultValue compareDescriptions rs
    | null rs || isNothing key' = Nothing
    | length rs == 1 = Just . DescriptionHistory (fromJust key') value' $ [(timestamp rs0, defaultValue)]
    | otherwise = Just . DescriptionHistory (fromJust key') value' $ (timestamp rs0, defaultValue) : history' where
        rs' = sortBy (comparing timestamp) rs
        rs0 = head rs'
        lookupKeyValue k = join . headMay . filter isJust . map (lookup k . description) $ rs
        key' = lookupKeyValue "key"
        value' = fromMaybe "*" . lookupKeyValue $ "value"
        tuples = uncurry zip . map21 (init, tail) . map description $ rs'
        history' = map (mapSnd fromJust) . filter (isJust . snd) . map (mapSnd $ uncurry compareDescriptions) . zip (tail . map timestamp $ rs') $ tuples
