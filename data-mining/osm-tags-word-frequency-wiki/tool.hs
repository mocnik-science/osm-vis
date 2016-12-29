{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE OverloadedStrings #-}

import Chorale.Common
import Control.Monad
import Data.Aeson hiding (Result)
import qualified Data.ByteString.Lazy.Char8 as C
import Data.Char (toLower)
import Data.List
import Data.Maybe
import Data.Time
import GHC.Generics
import Network.Curl
import Text.HTML.Scalpel

urlWikiBase :: String
urlWikiBase = "https://wiki.openstreetmap.org"
urlWikiPrefix :: String
urlWikiPrefix = "/wiki/"
urlWikiOverview :: Language -> String
urlWikiOverview lang = urlWikiBase ++ urlWikiPrefix ++ langPrefix lang ++ "Map_Features"
consideredLanguages :: [Language]
consideredLanguages = [
    Language "english" "en" "",
    Language "german" "de" "de:",
    Language "french" "fr" "fr:",
    Language "swedish" "sv" "sv:"]
urlWikiRaw :: String -> String
urlWikiRaw url = urlWikiBase ++ "/w/index.php?title=" ++ url ++ "&action=raw"
stopwordsFile :: Language -> String
stopwordsFile lang = "stopwords/" ++ langISO lang ++ ".txt"
outputFile :: String
outputFile = "../../data/osm-tags-word-frequency-wiki.json"

ignoreWordsWithCharacter :: String
ignoreWordsWithCharacter = ['{', '}', '[', ']', '<', '>', '*', '=', '|', '&']
charactersToRemoveFromRaw :: String
charactersToRemoveFromRaw = ['.', '(', ')', '\'', ',', '?', ':', ';']
wordsToIgnore :: [String]
wordsToIgnore = ["key", "value", "image", "description", "onnode", "onway", "onarea", "onrelation", "combination", "implies", "seealso", "status", "statuslink", "yes", "no", "decrepated", "approved"]
minWordLength :: Int
minWordLength = 5
numberOfWords :: Int
numberOfWords = 100

dataDescription' :: String
dataDescription' = "Word frequency in the tag description from the OpenStreetMap wiki"
dataSource' :: String
dataSource' = "OpenStreetMap project, <a href=\"http://wiki.openstreetmap.org/wiki/Wiki_content_license\" target=\"_blank\">CC BY-SA 2.0</a>"

-- --== MAIN

main :: IO ()
main = do
    wordFrequencies <- forM consideredLanguages $ \lang -> do
        tagUrls <- listOfTagUrls lang . urlWikiOverview $ lang
        ws <- rawToWords lang . concat =<< mapM downloadRaw tagUrls
        return $ WordFrequency (langName lang) (take numberOfWords . computeWordFrequency $ (ws :: [String]))
    timestamp' <- formatTime defaultTimeLocale "%Y-%m-%dT%H:%M:%S%Z" <$> getCurrentTime
    C.writeFile outputFile . encode $ Result timestamp' dataDescription' dataSource' (urlWikiOverview . head $ consideredLanguages) wordFrequencies

-- --== RESULT

data Result = Result {dataTimestamp :: String, dataDescription :: String, dataSource :: String, dataUrl :: String, wordFrequency :: [WordFrequency]} deriving Generic

instance ToJSON Result where
    toEncoding = genericToEncoding defaultOptions

-- --== WORD FREQUENCY

data WordFrequency = WordFrequency {language :: String, frequency :: [(String, Int)]} deriving (Generic, Show)

instance ToJSON WordFrequency where
    toEncoding = genericToEncoding defaultOptions

-- --== LANGUAGE

data Language = Language {langName :: String, langISO :: String, langPrefix :: String} deriving Show

-- --== EXTRACT TAGS

listOfTagUrls :: Language -> URL -> IO [URL]
listOfTagUrls lang = fmap (nubOrd . filter (isTagURL lang) . fromMaybe []) .* flip scrapeURL . attrs "href" $ "a"

isTagURL :: Language -> URL -> Bool
isTagURL lang = isPrefixOf ("/wiki/" ++ langPrefix lang ++ "tag:") . map toLower

-- --== EXTRACT CONTENT OF PAGE

downloadRaw :: URL -> IO String
downloadRaw = fmap snd . flip curlGetString [] . urlWikiRaw . fromMaybe "" . stripPrefix urlWikiPrefix

rawToWords :: Language -> String -> IO [String]
rawToWords lang = ignoreWords3 . ignoreWords2 . map removeCharacters . ignoreWords1 . map (map toLower) . ignoreWords0 . words where
    ignoreWords0 = filter ((>=) minWordLength . length)
    ignoreWords1 = flip (foldl (flip $ filter . notElem)) ignoreWordsWithCharacter
    ignoreWords2 = filter (`notElem` wordsToIgnore)
    ignoreWords3 ws = do
        stopwords <- filter (not . isPrefixOf "%") . lines <$> (readFile . stopwordsFile) lang
        return . filter (`notElem` stopwords) $ ws
    removeCharacters = filter (`notElem` charactersToRemoveFromRaw)

-- --== COMPUTE WORD FREQUENCY

computeWordFrequency :: [String] -> [(String, Int)]
computeWordFrequency = reverse . sortOn snd . map (map21 (head, length)) . sortAndGroup
