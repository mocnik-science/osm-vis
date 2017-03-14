const width = .8 * window.innerWidth
const height = .96 * window.innerHeight - 160

$(document).ready(() => {
  d3.json('../data/naturalearth_ne_110m_admin_0_countries.topojson', datasetCountries => {
    d3.json('../data/osm-node-changes-per-area.json', dataset => {
      // prepare data
      const dataTopoJson = datasetCountries.countries
      dataTopoJson.objects.countries.geometries = dataTopoJson.objects.countries.geometries.filter(d => d.properties.iso_a3 != 'ATA')
      const dataGeoJson = topojson.feature(dataTopoJson, dataTopoJson.objects.countries)
      
      // init svg
      const svg = pageFixed(width, height, 0, 16)
      
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
          .classed('country', true)
          .attr('d', path)
      
      // draw mean solar time
      const bbox = d3.geoBounds(dataGeoJson)
      const appendMeanSolarTime = (className, label) => {
        const mst = svg.append('g')
          .classed('meanSolarTime', true)
          .classed(className, true)
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
          .data(dataset.nodeChanges.filter(d => d.timestamp == mFormatted), d => (d.lat, d.lon, d.count))
        changes
          .enter()
          .append('circle')
            .classed('changes', true)
            .attr('data-lon', d => d.lon)
            .attr('transform', d => `translate(${projection([d.lon, d.lat])})`)
            .attr('r', d => Math.log(Math.sqrt(d.count)) * 1.5)
        changes
          .exit()
          .remove()
        
        // draw mean solar time
        svg.selectAll('.meanSolarTime8').attr('transform', d => `translate(${projection([360 * (1 - 1 / 24 * (m.hour() + m.minute() / 60 + m.second() / 3600 - 8)), 0])[0]}, 0)`)
        svg.selectAll('.meanSolarTime12').attr('transform', d => `translate(${projection([360 * (1 - 1 / 24 * (m.hour() + m.minute() / 60 + m.second() / 3600 - 12)), 0])[0]}, 0)`)
        svg.selectAll('.meanSolarTime16').attr('transform', d => `translate(${projection([360 * (1 - 1 / 24 * (m.hour() + m.minute() / 60 + m.second() / 3600 - 16)), 0])[0]}, 0)`)
      }
      
      // slider
      sliderTime({
        min: moment('00:00', 'HH:mm'),
        max: moment('24:00', 'HH:mm'),
        fromMax: moment('23:50', 'HH:mm'),
        fromFraction: [6, 2],
        step: 600,
        show: m => (m.isSame(moment('24:00', 'HH:mm'))) ? m.format('kk:mm') : m.format('HH:mm'),
        callback: redraw,
        width: width,
        label: 'UTC',
        labelLeft: moment(dataset.dataTimestamp).format('YYYY-MM-DD'),
        playingHide: false,
        playingSpeed: 2,
      })
      
      // page
      initPage({
        infoDescription: 'OSM data is changed every day by users all over the world. Local knowledge can be used to map the environment, but also aerial photographs can be used for mapping. Many more methods for mapping exist, and some of them require to be at the mapped place – this is usually done during the day –, while others can be used when being remote – this might also be done when it is night at the mapped place. This visualization explores at which hour of the day and in which regions of the world nodes of the OSM database are added, modified, or deleted.',
        infoIdea: [franzBenjaminMocnik],
        infoProgramming: [franzBenjaminMocnik],
        infoData: [
          dataset,
          datasetCountries,
        ],
        infoLibraries: libsDefault.concat([
          libIonRangeSlider,
          libMomentRound,
          libTopoJSON,
        ]),
        init: () => {
          initTooltip({
            selector: '.meanSolarTime12 text',
            text: 'This is noon in mean solar time. The mean solar time usually slightly differs from local time according to the equation of time.',
            positionMy: 'bottom left',
            positionAt: 'top center',
          })
          initTooltip({
            selector: `.changes[data-lon="${R.compose(R.apply(Math.min), R.mapObjIndexed(n => $(n).data('lon')))($('.changes'))}"]:first`,
            text: 'The change of nodes in the OSM database is depicted by a disk. The area of the disk is logarithmic in the number of edited nodes. The larger the disk, the more nodes are changed.',
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
  })
})
