const width = .8 * window.innerWidth
const height = .8 * window.innerHeight

$(document).ready(() => {
  const svg = d3.select('#svg')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('margin-left', -width / 2)
    .style('margin-top', -height / 2)
    .append('g')
  
  d3.json('../data/naturalearth/ne_110m_admin_0_countries.topojson', dataTopoJson => {
    d3.json('../data/osm-node-changes-per-area.json', data => {
      // prepare data
      console.debug(data)
      
      dataTopoJson.objects.countries.geometries = dataTopoJson.objects.countries.geometries.filter(d => d.properties.iso_a3 != 'ATA')
      const dataGeoJson = topojson.feature(dataTopoJson, dataTopoJson.objects.countries)
      
      // draw countries
      const projection = d3.geoMercator()
        .center([0, 50])
        .fitSize([width, height], dataGeoJson)
      const path = d3.geoPath().projection(projection)
      svg
        .selectAll('.country')
        .data(dataGeoJson.features)
        .enter()
          .append('path')
          .attr('class', 'country')
          .attr('d', path)
      
      // draw mean solar time
      const bbox = d3.geoBounds(dataGeoJson)
      const appendMeanSolarTime = (className, label) => {
        const mst = svg.append('g')
          .attr('class', className + ' meanSolarTime')
        mst.append('text')
          .attr('x', 6)
          .attr('y', projection([0, bbox[0][1]])[1])
          .text(label)
        mst.append('line')
          .attr('x1', 0)
          .attr('y1', projection([0, bbox[0][1]])[1] + 6)
          .attr('x2', 0)
          .attr('y2', projection([0, bbox[1][1]])[1] - 6)
      }
      appendMeanSolarTime('meanSolarTime8', '8:00 am')
      appendMeanSolarTime('meanSolarTime12', '12:00 (noon)')
      appendMeanSolarTime('meanSolarTime16', '16:00 pm')
      
      // draw changes
      const redraw = m => {
        // draw nodeChanges
        const mFormatted = moment(m).round(10, 'minutes').format('HH:mm')
        const changes = svg
          .selectAll('.changes')
          .data(data.nodeChanges.filter(d => d.timestamp == mFormatted), d => (d.lat, d.lon, d.count))
        changes
          .enter()
            .append('circle')
            .attr('class', 'changes')
            .attr('transform', d => 'translate(' + projection([d.lon, d.lat]) + ')')
            .attr('r', d => Math.log(Math.sqrt(d.count)) * 1.5)
        changes
          .exit()
          .remove()
        
        // draw mean solar time
        svg.selectAll('.meanSolarTime8').attr('transform', d => 'translate(' + projection([360 / 24 * (m.hour() + m.minute() / 60 + m.second() / 3600 - 8), 0])[0] + ', 0)')
        svg.selectAll('.meanSolarTime12').attr('transform', d => 'translate(' + projection([360 / 24 * (m.hour() + m.minute() / 60 + m.second() / 3600 - 12), 0])[0] + ', 0)')
        svg.selectAll('.meanSolarTime16').attr('transform', d => 'translate(' + projection([360 / 24 * (m.hour() + m.minute() / 60 + m.second() / 3600 - 16), 0])[0] + ', 0)')
      }
      
      // slider
      sliderTime({
        min: moment('00:00', 'HH:mm'),
        max: moment('24:00', 'HH:mm'),
        fromMax: moment('23:50', 'HH:mm'),
        fromFraction: [6, 2],
        step: 600,
        formatShow: 'HH:mm',
        callback: redraw,
        width: width,
        label: 'UTC',
        playingHide: false,
        playingSpeed: 60,
      })
    })
  })
})
