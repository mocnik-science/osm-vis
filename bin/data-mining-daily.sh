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

# commit to repository
DATE=`date +%Y-%m-%d`
PATH_DAY="../tmp/daily/$DATE/"
mkdir -p $PATH_DAY
tar -zcvf $PATH_DAY/osm-node-changes-per-area.json.tar.gz data/osm-node-changes-per-area.json
tar -zcvf $PATH_DAY/osmstats.json.tar.gz data/osmstats.json
cd ../tmp
git add *
git commit -m "daily@$DATE"
git push -u origin master
cd ../osm-vis

# post-merge hook
.git/hooks/post-merge
