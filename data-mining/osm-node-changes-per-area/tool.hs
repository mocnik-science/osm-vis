{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

import Chorale.Common
import qualified Codec.Compression.GZip as GZip
import Control.Monad
import Data.Aeson hiding (Result)
import qualified Data.ByteString as BB
import qualified Data.ByteString.Char8 as CC
import qualified Data.ByteString.Lazy as B
import qualified Data.ByteString.Lazy.Char8 as C
import Data.List
import Data.Maybe
import Data.Time
import GHC.Generics
import Network.Curl.Download

import Network.Curl.Download.Lazy
import Safe
import Text.XML.Hexml

urlState :: String
urlState = "https://planet.openstreetmap.org/replication/day/state.txt"
urlFile :: Int -> String
urlFile n = "https://planet.openstreetmap.org/replication/day/" ++ (justifyRight 3 '0' . show) (div n 1000000) ++ "/" ++ (justifyRight 3 '0' . show) (mod (div n 1000) 1000) ++ "/" ++ (justifyRight 3 '0' . show) (mod n 1000) ++ ".osc.gz"
outputFile :: String
outputFile = "../../data/osm-node-changes-per-area.json"

dataDescription' :: String
dataDescription' = "Statistics on node changes of OpenStreetMap data"
dataSource' :: String
dataSource' = "OpenStreetMap project, <a href=\"http://opendatacommons.org/licenses/odbl/\" target=\"_blank\">ODbL</a>"

-- --== MAIN

main :: IO ()
main = do
    (latestTimestamp', url', nodeChanges') <- downloadAndParseXml
    let nodeChangesStatistics = aggregateNodeChanges . map roundNodeChange $ nodeChanges'
    C.writeFile outputFile . encode $ Result latestTimestamp' dataDescription' dataSource' url' nodeChangesStatistics

-- --== RESULT

data Result = Result {dataTimestamp :: String, dataDescription :: String, dataSource :: String, dataUrl :: String, nodeChanges :: [NodeChangeStatistics]} deriving Generic

instance ToJSON Result where
    toEncoding = genericToEncoding defaultOptions

-- --== DOWNLOAD FILES

downloadAndParseXml :: IO (String, String, [NodeChangeUTCTime])
downloadAndParseXml = do
    info <- lines . either (error . ("[ERROR]" ++)) id <$> openURIString urlState
    let latestSequenceNumber = nothingToError "[ERROR] Could not read sequence number" . join . mapJust readMay . headMay . mapMaybe (stripPrefix "sequenceNumber=") $ info
    let latestTimestamp = nothingToError "[ERROR] Could not read timestamp" . mapJust (replaceElementInList '\\' "") . headMay . mapMaybe (stripPrefix "timestamp=") $ info
    nodeChanges' <- parseChangesXml . GZip.decompress . leftToError "[ERROR] Could not read file" <$> (openLazyURI . urlFile) latestSequenceNumber
    return (latestTimestamp, urlFile latestSequenceNumber, nodeChanges')

-- --== NODECHANGE

data NodeChangeUTCTime = NodeChangeUTCTime UTCTime Double Double deriving Show
data NodeChange = NodeChange String Double Double deriving (Show, Eq, Ord)
data NodeChangeStatistics = NodeChangeStatistics {timestamp :: String, lat :: Double, lon :: Double, count :: Int} deriving (Generic, Show)

instance ToJSON NodeChangeStatistics where
    toEncoding = genericToEncoding defaultOptions

-- --== PARSE XML

parseChangesXml :: B.ByteString -> [NodeChangeUTCTime]
parseChangesXml = mapMaybe parseChangeXml . flip childrenByDeep "node" . leftToError "[ERROR] Could not parse file" . parse . C.toStrict

childrenByDeep :: Node -> BB.ByteString -> [Node]
childrenByDeep node s = childrenBy node s ++ concatMap (`childrenByDeep` s) (children node)

parseChangeXml :: Node -> Maybe NodeChangeUTCTime
parseChangeXml node = if isJust timestamp' && all isJust [lat', lon']
    then Just $ NodeChangeUTCTime (fromJust timestamp') (fromJust lat') (fromJust lon')
    else Nothing where
        timestamp' = parseTimeM True defaultTimeLocale "%Y-%m-%dT%H:%M:%S%Z" . CC.unpack . attributeValue =<< attributeBy node "timestamp"
        lat' = readMay . CC.unpack. attributeValue =<< attributeBy node "lat"
        lon' = readMay . CC.unpack. attributeValue =<< attributeBy node "lon"

-- --== AGGREGATE NODECHANGES

roundNodeChange :: NodeChangeUTCTime -> NodeChange
roundNodeChange (NodeChangeUTCTime timestamp' lat' lon') = NodeChange ((\(h, m) -> h ++ ":" ++ m) . map12 (justifyRight 2 '0' . show) . map21 (todHour, (* 10) . flip div 10 . todMin) . timeToTimeOfDay . utctDayTime $ timestamp') (fromIntegral . (round :: Double -> Int) $ lat') (fromIntegral . (round :: Double -> Int) $ lon')

aggregateNodeChanges :: [NodeChange] -> [NodeChangeStatistics]
aggregateNodeChanges = map ((\(NodeChange timestamp' lat' lon', n) -> NodeChangeStatistics timestamp' lat' lon' n) . map21 (head, length)) . sortAndGroup

-- --== HELPERS

nothingToError :: String -> Maybe a -> a
nothingToError msg = \case
    Just a -> a
    Nothing -> error msg

leftToError :: String -> Either a b -> b
leftToError msg = leftToError' (const msg)

leftToError' :: (a -> String) -> Either a b -> b
leftToError' msg = \case
    Left a -> error . msg $ a
    Right b -> b
