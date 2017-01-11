d3.json('../data/osm-tags-wiki-vs-osmdata.json', function(json) {
  const data = json.data
  data.forEach(function(d) {
    d['date-wiki'] = new Date(d['date-wiki'])
    d['date-data'] = new Date(d['date-data'])
    d['count'] = +d['count']
  })

  const formatDate = d3.timeFormat('%Y-%m-%d')

  // init svg
  const width = window.innerWidth-10
  const height = window.innerHeight-10
  const svg = pageFixed(width, height, 0, 0)

  const k = height / width,
      x0 = [new Date('2005-06-01T00:00:00Z'), new Date('2017-01-01T00:00:00Z')],
      y0 = [new Date('2005-06-01T00:00:00Z'), new Date('2017-01-01T00:00:00Z')],
      x = d3.scaleUtc().domain(x0).range([0, width]),
      y = d3.scaleUtc().domain(y0).range([height, 0]),
      r = d3.scalePow().exponent(0.25).domain([0,1E7]).range([2,10]),
      key = d3.scaleOrdinal(d3.schemeCategory10)

  const xAxis = d3.axisTop(x).ticks(12),
      yAxis = d3.axisRight(y).ticks(12 * height / width)

  const brush = d3.brush().on('end', brushended)

  let idleTimeout
  const idleDelay = 350

  const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)


  svg.append('g')
      .attr('class', 'background')
      .append('path')
          .data([[new Date('2005-06-01T00:00:00Z'),new Date('2017-01-01T00:00:00Z')]])
          .attr('d', d3.line().x(d => x(d)).y(d => y(d)))

  svg.append('g')
      .attr('class', 'brush')
      .call(brush)

  svg.selectAll('circle')
    .data(data)
    .enter().append('circle')
      .attr('cx', d => x(d['date-wiki']))
      .attr('cy', d => y(d['date-data']))
      .attr('r', d => r(d['count']))
      .attr('fill', d => key(d['key']))
      .attr('opacity', 0.75)
      .on('mouseover', function(d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0.9)
        tooltip.html('<p><strong>'+d['key']+'='+d['value']+'</strong></p><p>first documented in the osm wiki:<br>'+formatDate(d['date-wiki'])+'<br>first used in the osm db:<br>'+formatDate(d['date-data'])+'</p>')
          .style('left', (d3.event.pageX + 8) + 'px')
          .style('top', (d3.event.pageY - 16) + 'px')
      })
      .on('mouseout', function(d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', 0)
      })

  svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + (height - 10) + ')')
      .call(xAxis)

  svg.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(10,0)')
      .call(yAxis)

  svg.selectAll('.domain')
      .style('display', 'none')

  function brushended() {
    var s = d3.event.selection
    if (!s) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay)
      x.domain(x0)
      y.domain(y0)
      r.range([2,10])
    } else {
      x.domain([s[0][0], s[1][0]].map(x.invert, x))
      y.domain([s[1][1], s[0][1]].map(y.invert, y))
      r.range([4,20])
      svg.select('.brush').call(brush.move, null)
    }
    zoom()
  }

  function idled() {
    idleTimeout = null
  }

  function zoom() {
    var t = svg.transition().duration(750)
    svg.select('.axis--x').transition(t).call(xAxis)
    svg.select('.axis--y').transition(t).call(yAxis)
    svg.selectAll('circle').transition(t)
        .attr('cx', d => x(d['date-wiki']))
        .attr('cy', d => y(d['date-data']))
        .attr('r', d => r(d['count']))
    svg.selectAll('.background path').transition(t)
        .attr('d', d3.line().x(d => x(d)).y(d => y(d)))
  }

})
