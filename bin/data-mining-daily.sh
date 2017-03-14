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
PATH_DATE="../../osm-vis-data/daily/$DATE/"
PATH_DATE_LOCAL="../daily/$DATE/"
cd data
mkdir -p $PATH_DATE
tar -zcvf $PATH_DATE/osm-node-changes-per-area.json.tar.gz osm-node-changes-per-area.json
tar -zcvf $PATH_DATE/osmstats.json.tar.gz osmstats.json
cd ../../osm-vis-data
ln -sf $PATH_DATE_LOCAL/osm-node-changes-per-area.json.tar.gz current/osm-node-changes-per-area.json.tar.gz
ln -sf $PATH_DATE_LOCAL/osmstats.json.tar.gz current/osmstats.json.tar.gz
git add *
git commit -m "daily@$DATE"
git push -u origin master
cd ../osm-vis

# post-merge hook
.git/hooks/post-merge
