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
PATH_DAY="../tmp/monthly/$DATE/"
mkdir -p $PATH_DAY
tar -zcvf $PATH_DAY/naturalearth_ne_110m_admin_0_countries.topojson.tar.gz data/naturalearth_ne_110m_admin_0_countries.topojson
tar -zcvf $PATH_DAY/osm-tags-history-wiki.json.tar.gz data/osm-tags-history-wiki.json
tar -zcvf $PATH_DAY/osm-tags-wiki-vs-osmdata.json.tar.gz data/osm-tags-wiki-vs-osmdata.json
tar -zcvf $PATH_DAY/osm-tags-word-frequency-wiki.json.tar.gz data/osm-tags-word-frequency-wiki.json
cd ../tmp
git add *
git commit -m "monthly@$DATE"
git push -u origin master
cd ../osm-vis

# post-merge hook
.git/hooks/post-merge
