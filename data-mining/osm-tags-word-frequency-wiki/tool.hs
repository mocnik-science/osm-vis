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
    Language "german" "de" "de:"]
--    Language "french" "fr" "fr:"]
urlWikiRaw :: String -> String
urlWikiRaw url = urlWikiBase ++ "/w/index.php?title=" ++ url ++ "&action=raw"
stopwordsFile :: Language -> String
stopwordsFile lang = "stopwords/" ++ langISO lang ++ ".txt"
outputFile :: String
outputFile = "../../data/osm-tags-word-frequency-wiki.json"

ignoreWordsWithCharacter :: String
ignoreWordsWithCharacter = ['{', '}', '[', ']', '<', '>', '*', '=', '|', '&']
charactersToRemoveFromRaw :: String
charactersToRemoveFromRaw = ['.', '(', ')', ',', '?', ':', ';']
charactersToRemoveFromRawAtEnd :: String
charactersToRemoveFromRawAtEnd = ['\'', '-']
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
        stopwords <- filter (not . isPrefixOf "%") . lines <$> (readFile . stopwordsFile) lang
        tagUrls <- listOfTagUrls lang . urlWikiOverview $ lang
        wss <- map (rawToWords stopwords) <$> mapM downloadRaw tagUrls
        return $ WordFrequency (langName lang) (take numberOfWords . computeWordFrequency . concat $ wss) (take numberOfWords . computeWordFrequency . concatMap nubOrd $ wss)
    timestamp' <- formatTime defaultTimeLocale "%Y-%m-%dT%H:%M:%S%Z" <$> getCurrentTime
    C.writeFile outputFile . encode $ Result timestamp' dataDescription' dataSource' (urlWikiOverview . head $ consideredLanguages) wordFrequencies

-- --== RESULT

data Result = Result {dataTimestamp :: String, dataDescription :: String, dataSource :: String, dataUrl :: String, wordFrequency :: [WordFrequency]} deriving Generic

instance ToJSON Result where
    toEncoding = genericToEncoding defaultOptions

-- --== WORD FREQUENCY

data WordFrequency = WordFrequency {language :: String, frequency :: [(String, Int)], frequencyOnlyOncePerTag :: [(String, Int)]} deriving (Generic, Show)

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

rawToWords :: [String] -> String -> [String]
rawToWords stopwords = ignoreWords4 . ignoreWords3 . map (removeCharacters2 . removeCharacters1) . ignoreWords2 . ignoreWords1 . map (map toLower) . words where
    ignoreWords1 = flip (foldl (flip $ filter . notElem)) ignoreWordsWithCharacter
    ignoreWords2 = filter (`notElem` wordsToIgnore)
    ignoreWords3 = filter (`notElem` stopwords)
    ignoreWords4 = filter ((>= minWordLength) . length)
    removeCharacters1 = filter (`notElem` charactersToRemoveFromRaw)
    removeCharacters2 = reverse . f . reverse . f where
        f [] = []
        f xss@(x:xs) = if x `elem` charactersToRemoveFromRawAtEnd
            then f xs
            else xss

-- --== COMPUTE WORD FREQUENCY

computeWordFrequency :: [String] -> [(String, Int)]
computeWordFrequency = reverse . sortOn snd . map (map21 (head, length)) . sortAndGroup
