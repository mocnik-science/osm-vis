const width = .9 * window.innerWidth
const height = .96 * window.innerHeight - 160
const timestampMin = '2012-01-01T00:00:00Z'

$(document).ready(() => {
  // helping functions
  const featureZeroTime = {properties: {timestamp: 0}}
  const featureToTime = f => moment(f.properties.timestamp)
  
  // map
  const map = L.map('map', {zoomControl: false, zoomSnap: 0})
  new L.StamenTileLayer('toner').setOpacity(.14).addTo(map)
  mapPreventDrag('timeslider')
  
  // draw changes
  var svgLayers = []
  var json2 = null
  const redrawFunction = json => {
    return m => {
      if (json === null) return
      const json2b = R.compose(R.reduce(R.maxBy(f => featureToTime(f).unix()), featureZeroTime), R.filter(f => moment(f.properties.timestamp).isSameOrBefore(m)))(json.features)
      if (json2 == json2b) return
      json2 = json2b
      for (const l of svgLayers) l.removeFrom(map)
      if (json2.geometry === undefined) return
      svgLayers = [L.geoJSON(json2, {color: colorPrimaryDark, fillColor: colorPrimaryDark, fillOpacity: .4}).addTo(map)]
      for (const p of json2.geometry.coordinates[0]) svgLayers.push(L.circleMarker(R.reverse(p), {color: colorPrimaryDark, fillColor: 'white', fillOpacity: 1, radius: 4}).addTo(map))
    }
  }
  
  // slider
  const slider = new SliderTime({
    min: moment(timestampMin),
    max: moment(),
    fromFraction: [6, 2],
    width: width,
    playingHide: false,
    playingSpeed: 1250,
  })
  
  // options panel
  new OptionsPanel({
    elements: [
      {
        type: 'radio',
        name: 'data',
        values: {
          254154168: {label: 'Heidelberg Castle', selected: true},
          0: '...',
        },
      },
    ],
    onStoreUpdate: store => $.getJSON(`../data/tmp/${store.data}.geojson`, json => {  
      // fit bounds of the map
      const elementPolygon = L.geoJSON(json)
      map.fitBounds(elementPolygon.getBounds(), {padding: [(window.innerWidth - width) / 2, (window.innerHeight - height) / 2]})
      
      // update redraw function
      slider.setCallback(redrawFunction(json))
    })
  })
  
  // page
  initPage({
    infoDescription: 'OSM elements are modified to reflect changes of the environment, or to improve the quality of the data. These modifications are interesting to examine for single OSM elements because they illustrate how the OSM data is changing. This visualization shows how the boundary defining an OSM element is changing in its history.',
    infoIdea: [franzBenjaminMocnik],
    infoProgramming: [franzBenjaminMocnik, martinRaifer],
    infoData: [heigitDB()],
    infoLibraries: libsDefault.concat([
      libIonRangeSlider,
    ]),
    init: () => {
      initTooltip({
        selector: 'input[name="data"]:first',
        text: 'Choose different elements to examine.',
        positionMy: 'bottom left',
        positionAt: 'top center',
      })
      initTooltip({
        selector: `.irs-slider`,
        text: 'Drag to change the point in time',
        positionMy: 'bottom left',
        positionAt: 'top center',
      })
      initTooltip({
        selector: '.timesliderPlaying',
        text: 'Click here to animate time',
        positionMy: 'bottom right',
        positionAt: 'top right',
      })
    },
  })
})
