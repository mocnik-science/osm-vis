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

# commit to repository
DATE=`date +%Y-%m-%d`
PATH_DATE="../../osm-vis-data/monthly/$DATE/"
PATH_DATE_LOCAL="../monthly/$DATE/"
cd data
mkdir -p $PATH_DATE
tar -zcvf $PATH_DATE/naturalearth_ne_110m_admin_0_countries.topojson.tar.gz naturalearth_ne_110m_admin_0_countries.topojson
tar -zcvf $PATH_DATE/osm-tags-history-wiki.json.tar.gz osm-tags-history-wiki.json
tar -zcvf $PATH_DATE/osm-tags-wiki-vs-osmdata.json.tar.gz osm-tags-wiki-vs-osmdata.json
tar -zcvf $PATH_DATE/osm-tags-word-frequency-wiki.json.tar.gz osm-tags-word-frequency-wiki.json
cd ../../osm-vis-data
ln -sf $PATH_DATE_LOCAL/naturalearth_ne_110m_admin_0_countries.topojson.tar.gz current/naturalearth_ne_110m_admin_0_countries.topojson.tar.gz
ln -sf $PATH_DATE_LOCAL/osm-tags-history-wiki.json.tar.gz current/osm-tags-history-wiki.json.tar.gz
ln -sf $PATH_DATE_LOCAL/osm-tags-wiki-vs-osmdata.json.tar.gz current/osm-tags-wiki-vs-osmdata.json.tar.gz
ln -sf $PATH_DATE_LOCAL/osm-tags-word-frequency-wiki.json.tar.gz current/osm-tags-word-frequency-wiki.json.tar.gz
git add *
git commit -m "monthly@$DATE"
git push -u origin master
cd ../osm-vis

# post-merge hook
.git/hooks/post-merge
