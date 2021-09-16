#!/usr/bin/env node

const URL = 'http://blackadder.dev.openstreetmap.org/OSMStats/osmstats20210317.csv'
const DATA_PATH = '../../data'
const DATA_FILE = 'osmstats.json'

const execSync = require('child_process').execSync
const request = require('sync-request')
const jsonfile = require('jsonfile')
const moment = require('moment')

execSync(`mkdir -p ${DATA_PATH}`)
const contentCsv = request('GET', URL).getBody('utf-8')
jsonfile.writeFileSync(`${DATA_PATH}/${DATA_FILE}`, {
  dataTimestamp: moment().format('YYYY-MM-DDTHH:mm:ssZ'),
  dataDescription: 'OSM statistics',
  dataSource: 'OSMStats; OpenStreetMap project, <a href=\"http://opendatacommons.org/licenses/odbl/\" target=\"_blank\">ODbL</a>',
  dataUrl: URL,
  data: contentCsv,
})
