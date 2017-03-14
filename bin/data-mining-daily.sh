#!/usr/bin/env bash
set -e

# osm-vis/osm-node-changes-per-area
cd data-mining/osm-node-changes-per-area
cabal run
cd ../..

# osm-vis/osmstats
cd data-mining/osmstats
./run.js
cd ../..

# post-merge hook
.git/hooks/post-merge
