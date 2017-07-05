const width = .9 * window.innerWidth
const height = .96 * window.innerHeight - 180
const timestampMin = '2008-08-01T00:00:00Z'

$(document).ready(() => {
  // helping functions
  const featureZeroTime = {properties: {timestamp: 0}}
  const featureToTime = f => moment(f.properties.timestamp)
  
  // map
  const map = L.map('map', {zoomControl: false, zoomSnap: 0, scrollWheelZoom: false, touchZoom: false, boxZoom: false, doubleClickZoom: false, dragging: false})
  new L.StamenTileLayer('toner').setOpacity(.14).addTo(map)
  mapPreventDrag('timeslider')
  
  // draw changes
  var svgLayers = []
  var json2 = null
  const redrawFunction = json => {
    return m => {
      if (json === null) return
      const json2b = R.compose(R.reduce(R.maxBy(f => featureToTime(f).unix()), featureZeroTime), R.filter(f => moment(f.properties.timestamp).isSameOrBefore(m)))(topojson.getObject(json).geometries)
      if (json2 == json2b) return
      json2 = json2b
      for (const l of svgLayers) l.removeFrom(map)
      const geoJson = topojson.feature(json, json2)
      if (geoJson.geometry === null) return
      svgLayers = [L.geoJSON(geoJson, {color: colorPrimaryDark, fillColor: colorPrimaryDark, fillOpacity: .4}).addTo(map)]
      const drawNodes = cs => {
        if (cs instanceof Array) {
          if (cs[0] instanceof Array) R.forEach(drawNodes, cs)
          else svgLayers.push(L.circleMarker(R.reverse(cs), {color: colorPrimaryDark, fillColor: 'white', fillOpacity: 1, radius: 2, weight: 2}).addTo(map))
        }
      }
      drawNodes(geoJson.geometry.coordinates)
    }
  }
  
  // slider
  const slider = new SliderTime({
    min: moment(timestampMin),
    max: moment(),
    width: width,
    playingHide: false,
    playingSpeed: 1250,
    playingRestartOnEnd: false,
  })
  
  // options panel
  new OptionsPanel({
    elements: [
      {
        type: 'radio',
        name: 'data',
        values: [
          ['r60105', {label: 'Mannheim Palace (Germany)', selected: true}],
          ['w254154168', 'Heidelberg Castle (Germany)'],
          ['w150834648', 'Luisenpark, Mannheim (Germany)'],
          ['w26946230', 'New Campus ‘Neuenheimer Feld’, Heidelberg (Germany)'],
        ],
      },
    ],
    onStoreUpdate: store => $.getJSON(`../data/tmp/${store.data}.topojson`, json => {
      // fit bounds of the map
      map.fitBounds(topojson.getBounds(json), {padding: [(window.innerWidth - width) / 2, (window.innerHeight - height) / 2]})
      
      // update redraw function
      slider.setCallback(redrawFunction(json))
      
      // move slider to the start of the element
      const getTime = (f, tToCompare) => R.compose(R.reduce(f(t => t.unix()), tToCompare), R.map(featureToTime))(topojson.getObject(json).geometries)
      slider.stopPlaying()
      slider.setFrom(getTime(R.minBy, moment()))
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
      libMomentRound,
      libTopoJSON,
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
