const queue = require('d3-queue').queue
const fetch = require('node-fetch')
const fs = require('fs')

const wiki = require('../../data/osm-tags-history-wiki.json')

const out = {
  dataSource: 'OpenStreetMap project, wiki content © <a href="http://wiki.openstreetmap.org/wiki/Wiki_content_license" target="_blank">CC BY-SA 2.0</a>, data © <a href="http://openstreetmap.org/copyright" target="_blank">ODbL</a>',
  dataDescription: 'Comparison between first occurence of OSM tags in OpenStreetMap\'s data and wiki',
  dataTimestamp: (new Date()).toISOString(),
  dataUrl: 'http://taghistory.raifer.tech',
  data: wiki.descriptionHistory.map(wikipage => ({
    key: wikipage.key,
    value: wikipage.value,
    'date-wiki': wikipage.history[0][0].substr(0, 10),
    'date-data': null,
    count: null,
  })),
}

const miningQueue = queue(3)

out.data.forEach(wikipage => {
  miningQueue.defer(callback => {
    fetch(`http://taghistory.raifer.tech/***/${encodeURIComponent(wikipage.key)}${(wikipage.value !== '*') ? '/' + encodeURIComponent(wikipage.value) : ''}`)
      .then(response => response.json())
      .then(json => {
        if (json.length == 0 || json[0].date == undefined) callback(null)
        callback(null, {
            date: json[0].date.substr(0, 10),
            count: json[json.length - 1].count,
        })
    }).catch(callback)
  })
})

miningQueue.awaitAll((err, results) => {
  if (err) return console.error(err)
  results.forEach((result, index) => {
    if (!result) return
    out.data[index]['date-data'] = result.date
    out.data[index].count = result.count
  })
  fs.writeFileSync('../../data/osm-tags-wiki-vs-osmdata.json', JSON.stringify(out))
})
