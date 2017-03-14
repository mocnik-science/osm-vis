#!/usr/bin/env bash

# osm-vis/osm-node-changes-per-area
cd data-mining/osm-node-changes-per-area
cabal sandbox init && cabal update && cabal install --force-reinstalls
cd ../..

# osm-vis/osm-tags-history-wiki
cd data-mining/osm-tags-history-wiki
cabal sandbox init && cabal update && cabal install --force-reinstalls
cd ../..

# osm-vis/osm-tags-wiki-vs-osmdata
cd data-mining/osm-tags-wiki-vs-osmdata
npm install
cd ../..

# osm-vis/osm-tags-word-frequency-wiki
cd data-mining/osm-tags-word-frequency-wiki
cabal sandbox init && cabal update && cabal install --force-reinstalls
cd ../..
