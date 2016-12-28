#!/usr/bin/env node

const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson.gz'
const DATA_PATH = '../../data/naturalearth'
const DATA_FILE_GEO = 'ne_110m_admin_0_countries.geojson'
const DATA_FILE_GEO_TMP = 'countries.geojson'
const DATA_FILE_TOPO = 'ne_110m_admin_0_countries.topojson'
const geo2topo = '../../node_modules/.bin/geo2topo'

const execSync = require('child_process').execSync
const jsonfile = require('jsonfile')

execSync(`mkdir -p ${DATA_PATH}`)
execSync(`curl ${URL} | gunzip > ${DATA_PATH}/${DATA_FILE_GEO}`)
const content = jsonfile.readFileSync(`${DATA_PATH}/${DATA_FILE_GEO}`)
content.features = content.features.map(feature => {
  feature.properties = {iso_a3: feature.properties['iso_a3'], name: feature.properties['name']}
  return feature
})
jsonfile.writeFileSync(`${DATA_PATH}/${DATA_FILE_GEO_TMP}`, content)
execSync(`${geo2topo} ${DATA_PATH}/${DATA_FILE_GEO_TMP} -o ${DATA_PATH}/${DATA_FILE_TOPO}`)
execSync(`rm ${DATA_PATH}/${DATA_FILE_GEO}`)
execSync(`rm ${DATA_PATH}/${DATA_FILE_GEO_TMP}`)
