#!/usr/bin/env node

const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson.gz'
const DATA_PATH = '../../data'
const DATA_FILE_GEO = 'ne_110m_admin_0_countries.geojson'
const DATA_FILE_GEO_TMP = 'countries.geojson'
const DATA_FILE_TOPO = 'naturalearth_ne_110m_admin_0_countries.topojson'
const DATA_FILE_TOPO_TMP = 'countries.topojson'
const geo2topo = '../../node_modules/.bin/geo2topo'

const execSync = require('child_process').execSync
const jsonfile = require('jsonfile')
const moment = require('moment')

execSync(`mkdir -p ${DATA_PATH}`)
execSync(`curl ${URL} | gunzip > ${DATA_PATH}/${DATA_FILE_GEO}`)
const contentJson = jsonfile.readFileSync(`${DATA_PATH}/${DATA_FILE_GEO}`)
contentJson.features = contentJson.features.map(feature => {
  feature.properties = {iso_a3: feature.properties['iso_a3'], name: feature.properties['name']}
  return feature
})
jsonfile.writeFileSync(`${DATA_PATH}/${DATA_FILE_GEO_TMP}`, contentJson)
execSync(`${geo2topo} ${DATA_PATH}/${DATA_FILE_GEO_TMP} -o ${DATA_PATH}/${DATA_FILE_TOPO_TMP}`)
const contentTopo = jsonfile.readFileSync(`${DATA_PATH}/${DATA_FILE_TOPO_TMP}`)
jsonfile.writeFileSync(`${DATA_PATH}/${DATA_FILE_TOPO}`, {
  dataTimestamp: moment().format('YYYY-MM-DDTHH:mm:ssZ'),
  dataDescription: 'Countries and their boundaries',
  dataSource: 'Made with Natural Earth, www.naturalearthdata.com, <a href="http://www.naturalearthdata.com/about/terms-of-use/" target="_blank">license</a>',
  dataUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson.gz',
  countries: contentTopo,
})
execSync(`rm ${DATA_PATH}/${DATA_FILE_GEO}`)
execSync(`rm ${DATA_PATH}/${DATA_FILE_GEO_TMP}`)
execSync(`rm ${DATA_PATH}/${DATA_FILE_TOPO_TMP}`)
