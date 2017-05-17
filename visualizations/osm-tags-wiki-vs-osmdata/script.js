const thresholds = [1, 10, 100, 1000]

d3.json('../data/osm-tags-wiki-vs-osmdata.json', dataset => {
  dataset.data.forEach(d => {
    d['date-wiki'] = new Date(d['date-wiki'])
    for (const threshold of thresholds) d[`date-data-${threshold}`] = new Date(d[`date-data-${threshold}`])
    d['count'] = +d['count']
  })
  const data = dataset.data
  const dates = R.compose(R.map(moment), R.flatten)([R.map(R.prop('date-wiki'), data), ...R.map(threshold => R.map(R.prop(`date-data-${threshold}`), data), thresholds)])
  const datesInterval = [moment.min(dates), moment.max(dates)]
  
  const formatDate = d3.timeFormat('%Y-%m-%d')
  
  const width = window.innerWidth
  const height = window.innerHeight
  const svg = pageFixed(width, height, 0, 0)
  
  const x0 = datesInterval
  const y0 = datesInterval
  const x = d3.scaleUtc().domain(x0).range([0, width])
  const y = d3.scaleUtc().domain(y0).range([height, 0])
  const r = d3.scalePow().exponent(.25).domain([0, 1E7]).range([2, 10])
  const key = d3.scaleOrdinal(d3.schemeCategory20)
  
  const xAxis = d3.axisTop(x).ticks(12)
  const yAxis = d3.axisRight(y).ticks(12 * height / width)
  const yAxis2 = d3.axisLeft(y).ticks(12 * height / width)
  
  const brush = d3.brush().on('end', () => brushended())
  
  let idleTimeout
  const idleDelay = 350
  
  // tooltip
  initDataTooltip()
  
  // diagonal
  svg.append('g')
    .append('path')
      .classed('diagonal', true)
      .data([datesInterval])
      .attr('d', d3.line().x(x).y(y))
  
  // brush
  svg.append('g')
    .classed('brush', true)
    .call(brush)
  const brushended = () => {
    const s = d3.event.selection
    if (!s) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay)
      x.domain(x0)
      y.domain(y0)
      r.range([2, 10])
    } else {
      x.domain([s[0][0], s[1][0]].map(x.invert, x))
      y.domain([s[1][1], s[0][1]].map(y.invert, y))
      r.range([4, 20])
      svg.select('.brush').call(brush.move, null)
    }
    zoom()
  }
  const idled = () => {
    idleTimeout = null
  }
  let zoom = () => {}
  
  // axes
  const axes = svg.append('g')
    .classed('axes', true)
  axes.append('g')
    .classed('axis axis-x', true)
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
  axes.append('text')
    .classed('axis-label', true)
    .attr('x', width / 2)
    .attr('y', height - 25)
    .style('text-anchor', 'middle')
    .text('first documentation in the OSM wiki')
  axes.append('g')
    .classed('axis axis-y', true)
    .call(yAxis)
  axes.append('g')
    .classed('axis axis-y', true)
    .attr('transform', `translate(${width}, 0)`)
    .call(yAxis2)
  axes.append('text')
    .classed('axis-label', true)
    .classed('axis-label-y', true)
    .attr('transform', 'rotate(-90)')
    .attr('x', - height / 2)
    .attr('y', 50)
    .style('text-anchor', 'middle')
  
  // data
  const dataCircles = svg.selectAll('circle')
    .data(data)
    .enter().append('circle')
      .attr('cx', d => x(d['date-wiki']))
      .attr('cy', d => y(d[`date-data-${thresholds[0]}`]))
      .attr('r', d => r(d['count']))
      .attr('fill', d => key(d['key']))
      .attr('opacity', .75)
      .on('mouseover', d => showDataTooltip(d3.event.pageX, d3.event.pageY, `${d['key']}=${d['value']}`, tooltipText(d)))
      .on('mouseout', () => hideDataTooltip())
  
  // update for threshold
  const thresholdToString = threshold => {
    if (threshold == 1) return 'first'
    else if (threshold == 2) return `${threshold}-nd`
    else if (threshold == 3) return `${threshold}-rd`
    else return `${threshold}-th`
  }
  const tooltipText = d => {
    let text = `<span class="date">${formatDate(d['date-wiki'])}</span> first documention in the OSM wiki`
    for (const threshold of thresholds) text += `<br><span class="date">${formatDate(d[`date-data-${threshold}`])}</span> ${thresholdToString(threshold)} use in the OSM database`
    return text
  }
  const updateForThreshold = threshold => {
    // brush
    zoom = () => {
      const t = svg.transition().duration(750)
      svg.select('.axis-x').transition(t).call(xAxis)
      svg.select('.axis-y').transition(t).call(yAxis)
      svg.selectAll('circle').transition(t)
        .attr('cx', d => x(d['date-wiki']))
        .attr('cy', d => y(d[`date-data-${threshold}`]))
        .attr('r', d => r(d['count']))
      svg.selectAll('.diagonal').transition(t)
        .attr('d', d3.line().x(x).y(y))
    }
    
    // axis
    d3.selectAll('.axis-label-y')
      .text(`${thresholdToString(threshold)} use in OSM database`)

    // data
    dataCircles
      .transition(idleDelay)
      .attr('cy', d => y(d[`date-data-${threshold}`]))
  }
  
  // options panel
  const thresholdValues = {}
  let thresholdValuesFirst = true
  for (const threshold of thresholds) {
    if (thresholdValuesFirst) {
      thresholdValuesFirst = false
      thresholdValues[threshold] = {label: `${thresholdToString(threshold)} use`, selected: true}
    } else {
      thresholdValues[threshold] = `${thresholdToString(threshold)} use`
    }
  }
  new OptionsPanel({
    elements: [{
      type: 'radio',
      name: 'threshold',
      values: thresholdValues,
    }],
    onStoreUpdate: store => updateForThreshold(store.threshold),
  })
  $('.panel').css({marginBottom: -$('.panel').outerHeight() / 2})

  // page
  initPage({
    infoDescription: 'The core tags, which are used in OSM to describe nodes, ways, and relations, are usually documented in the <a href="https://wiki.openstreetmap.org/wiki/Map_Features" target="_blank">OSM wiki</a>. There is, however, no formal requirement to do so, and tags are, in consequence, used in the OSM database often before they are documented in the OSM wiki, if at all. This visualization explores how these two dates, the first (or later) use in the OSM database and the first documentation in the OSM wiki, correlate.',
    infoIdea: [martinRaifer],
    infoProgramming: [martinRaifer, franzBenjaminMocnik],
    infoData: [dataset],
    infoLibraries: libsDefault,
    init: () => {
      initTooltip({
        selector: 'circle:first',
        text: 'The position of a point decodes the first use in the OSM wiki and the OSM database, and its radius relates to the number of uses in current data. Different colors refer to different tag keys.',
      })
      initTooltip({
        selector: '.diagonal',
        text: 'A tag which is documentedf in the OSM wiki at the time of its first use in the OSM database is depicted on the diagonal',
        positionMy: 'bottom right',
        positionAt: 'center',
      })
    },
  })
})
