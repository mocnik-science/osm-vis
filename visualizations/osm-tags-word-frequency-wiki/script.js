const diameter = Math.min(window.innerHeight, window.innerWidth) - 50
const labelWidth = 120
const animationDuration = 300
const animationDelay = 100
const animationEventDelay = 450
const animationEventHold = 600

$(document).ready(() => {
  d3.json('../data/osm-tags-history-wiki.json', dataset => {
    // prepare the data
    const data = _(dataset.descriptionHistory).map(d => {
      d.history = _(d.history).map(h => [moment(h[0]), h[1]])
      return d
    })
    const dates = _(data).chain().map(d => _(d.history).map(ts => ts[0])).flatten().value()
    const datesMin = moment.min(dates)
    const datesMax = moment.max(dates)
    const prepareDataForTree = dat => {
      var dataTreeTmp = _(dat).map(d => {
        d.id = d.key + '======' + d.value
        d.parentId = d.key
        return d
      })
      const keys = _(dat).chain().map(x => x.key).uniq().value()
      dataTreeTmp = dataTreeTmp.concat(_(keys).map(k => ({id: k, parentId: '===root===', key: k})))
      return dataTreeTmp.concat([{id: '===root===', parentId: null}])
    }
    
    // diagram
    const svg = d3.select('#svg')
      .append('svg')
      .attr('width', diameter)
      .attr('height', diameter)
      .style('margin-left', -diameter / 2)
      .style('margin-top', -diameter / 2)
      .append('g')
      .attr('transform', `translate(${diameter / 2}, ${diameter / 2})`)
    
    var angle = 0;
    const computeAngle = () => {
      const box = d3.select('#svg').select('svg').node().getBoundingClientRect()
      const centerX = d3.event.x - box.left - box.width / 2
      const centerY = d3.event.y - box.top - box.height / 2
      return (Math.atan (centerY / centerX) + (centerX < 0 ? Math.PI : 0)) / (2 * Math.PI) * 180 
    }
    const rotateStart = () => {
      angle -= computeAngle()
    }
    const rotate = () => {
      const a = computeAngle()
      svg.attr('transform', `translate(${diameter / 2}, ${diameter / 2}) rotate(${angle + a})`)
    }
    const rotateEnd = () => {
      angle = angle + computeAngle()
    }
    d3.select('#svg').call(d3.drag().on('start', rotateStart).on('drag', rotate).on('end', rotateEnd))
    
    const stratify = d3.stratify().id(d => d.id).parentId(d => d.parentId)
    const tree = d3.tree()
      .size([360, diameter / 2 - labelWidth])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
    const project = (a, radius) => [radius * Math.cos((a - 90) / 180 * Math.PI), radius * Math.sin((a - 90) / 180 * Math.PI)]
    
    var lastRedraw = null
    const redraw = m => {
      const dataTree = prepareDataForTree(_(data).filter(d => _(d.history).some(h => h[0].isSameOrBefore(m)) && _(d.history).every(h => h[0].isAfter(m) || h[1] > 0)))
      const root = tree(stratify(_(dataTree).sortBy(x => x.id)))
      
      // draw edges
      const edge = svg
        .selectAll('.edge')
        .data(_(root.descendants()).filter(d => d.data.key !== undefined && d.data.value !== undefined), d => d.data.id)
      edge
        .enter()
        .append('path')
        .style('opacity', 0)
        .classed('edge', true)
        .attr('d', d => `M${project(d.x, d.y)}C${project(d.x, (d.y + d.parent.y) / 2)} ${project(d.parent.x, (d.y + d.parent.y) / 2)} ${project(d.parent.x, d.parent.y)}`)
      edge
        .exit()
        .remove()
      d3.timeout(() => {
        svg.selectAll('.edge')
          .style('opacity', 1)
      }, animationDuration + 2 * animationDelay)
      
      // animate edges
      d3.timeout(() => {
        svg.selectAll('.edge')
          .transition()
          .duration(animationDuration)
          .attr('d', d => `M${project(d.x, d.y)}C${project(d.x, (d.y + d.parent.y) / 2)} ${project(d.parent.x, (d.y + d.parent.y) / 2)} ${project(d.parent.x, d.parent.y)}`)
      }, animationDelay)
      
      // draw nodes
      const node = svg
        .selectAll('.node')
        .data(_(root.descendants()).filter(d => d.data.key !== undefined), d => d.data.id)
      const nodeG = node
        .enter()
        .append('g')
          .style('opacity', 0)
          .classed('node', true)
          .classed('node-internal', d => d.children)
          .classed('node-leaf', d => !d.children)
          .classed('event', d => d.data.value !== undefined && _(d.data.history).some(h => (h[0].isAfter(lastRedraw) && h[0].isSameOrBefore(m)) || h[0].isAfter(m) && h[0].isSameOrBefore(lastRedraw)))
          .attr('transform', d => 'translate(' + project(d.x, d.y) + ')')
      nodeG
        .append('circle')
        .attr('r', 2.5)
      nodeG
        .append('text')
          .text(d => (d.data.value) ? d.data.value : d.data.key)
          .attr('dy', '.31em')
          .attr('x', d => !d.children ? 6 : -6)
          .style('text-anchor', d => !d.children ? 'start' : 'end')
          .attr('transform', d => `rotate(${d.x - 90})`)
      node
        .exit()
        .remove()
      d3.timeout(() => {
        svg.selectAll('.node')
          .style('opacity', 1)
      }, animationDuration + 2 * animationDelay)
      
      // animate nodes
      d3.timeout(() => {
        svg.selectAll('.node')
          .transition()
          .duration(animationDuration)
            .attr('transform', d => `translate(${project(d.x, d.y)})`)
        svg.selectAll('.node').select('text')
            .transition()
            .duration(animationDuration)
            .attr('x', d => !d.children ? 6 : -6)
            .style('text-anchor', d => !d.children ? 'start' : 'end')
            .attr('transform', d => `rotate(${d.x - 90})`)
      }, animationDelay)
      
      // animate nodes which have a modification in their history
      svg.selectAll('.event')
        .classed('event', false)
        .select('circle')
        .transition()
        .delay(animationEventDelay)
        .duration(animationEventHold)
          .attr('r', 5)
        .transition()
        .delay(1.3 * animationEventHold)
        .duration(animationEventHold)
          .attr('r', 2.5)
      
      // save m to lastRedraw
      lastRedraw = m
    }
    
    // slider
    sliderTime({
      min: datesMin,
      max: datesMax,
      fromFraction: [2, 1],
      callback: redraw,
      width: diameter,
      playingHide: false,
      playingSpeed: 1250,
      playingFrameRate: 300,
    })
    
    // page
    initPage({
      infoDescription: 'The core tags, which are used in OSM to descripe nodes, ways, and relations, are documented in the <a href="https://wiki.openstreetmap.org/wiki/Map_Features" target="_blank">OSM wiki</a>. This documentation serves as an ontology but there is no obligation to not use other tags. This visualization explores how the documented tags, i.e., keys and values, have developed over time.',
      infoIdea: [alexanderZipf, franzBenjaminMocnik],
      infoProgramming: [franzBenjaminMocnik],
      infoData: [
        dataset,
      ],
      init: () => {
        initTooltip({
          selector: '.node-internal:first',
          text: 'The keys are depicted in the inner circle',
        })
        initTooltip({
          selector: '.node-leaf:first',
          text: 'The values are depicted in the outer circle',
        })
        initTooltip({
          selector: `.node:eq(${Math.round($('.node').length / 2)})`,
          text: 'Drag to rotate',
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