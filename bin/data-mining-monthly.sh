#!/usr/bin/env bash
set -e

# osm-vis/naturalearth
cd data-mining/naturalearth
./run.js
cd ../..

# osm-vis/osm-tags-history-wiki
cd data-mining/osm-tags-history-wiki
cabal run
cd ../..

# osm-vis/osm-tags-wiki-vs-osmdata
cd data-mining/osm-tags-wiki-vs-osmdata
npm start
cd ../..

# osm-vis/osm-tags-word-frequency-wiki
cd data-mining/osm-tags-word-frequency-wiki
cabal run
cd ../..

# post-merge hook
.git/hooks/post-merge
