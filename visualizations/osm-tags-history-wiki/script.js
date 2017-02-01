const width = window.innerWidth
const height = window.innerHeight
const labelWidth = 120
const animationDuration = 300
const animationDelay = 100
const animationEventDelay = 450
const animationEventHold = 600

const angle = (x, y) => Math.atan(y / x) + (x < 0 ? Math.PI : 0)
const length = (x, y) => Math.sqrt(x * x + y * y)

$(document).ready(() => {
  d3.json('../data/osm-tags-history-wiki.json', dataset => {
    // prepare the data
    const data = R.map(d => {
      d.history = R.map(h => [moment(h[0]), h[1]], d.history)
      return d
    }, dataset.descriptionHistory)
    const dates = R.compose(R.flatten, R.map(d => R.map(ts => ts[0], d.history)))(data)
    const datesMin = moment.min(dates)
    const datesMax = moment.max(dates)
    const prepareDataForTree = dat => {
      var dataTreeTmp = R.compose(R.map(d => {
        d.id = d.key + '======' + d.value
        d.parentId = d.key
        return d
      }), R.filter(R.complement(R.propEq('value', '*'))))(dat)
      const keys = R.compose(R.uniq(), R.map(R.prop('key')))(dat)
      dataTreeTmp = dataTreeTmp.concat(R.map(k => ({id: k, parentId: '===root===', key: k}), keys))
      return dataTreeTmp.concat([{id: '===root===', parentId: null}])
    }
    
    // init svg
    const svgParent = pageFixed(width, height, 0, 0)
        .attr('transform', `translate(${width / 2}, ${height / 2})`)
    
    // diagram
    const svg = svgParent.append('g')
    svgParent.append('g').classed('svg-hover', true)
    
    var svgAngle = 0;
    const computeAngle = () => {
      const box = d3.select('.svg').select('svg').node().getBoundingClientRect()
      const centerX = d3.event.x - box.left - box.width / 2
      const centerY = d3.event.y - box.top - box.height / 2
      return angle(centerX, centerY) / (2 * Math.PI) * 180 
    }
    const rotateStart = () => {
      svgAngle -= computeAngle()
    }
    const rotate = () => {
      const a = computeAngle()
      svgParent.attr('transform', `translate(${width / 2}, ${height / 2}) rotate(${svgAngle + a})`)
    }
    const rotateEnd = () => {
      svgAngle += computeAngle()
    }
    d3.select('.svg').call(d3.drag().on('start', rotateStart).on('drag', rotate).on('end', rotateEnd))
    
    const stratify = d3.stratify().id(d => d.id).parentId(d => d.parentId)
    const tree = d3.tree()
      .size([360, Math.min(width, height) / 2 - labelWidth])
      .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
    const project = (a, radius) => [radius * Math.cos((a - 90) / 180 * Math.PI), radius * Math.sin((a - 90) / 180 * Math.PI)]
    
    var lastRedraw = null
    const redraw = m => {
      const dataTree = prepareDataForTree(R.filter(d => R.any(h => h[0].isSameOrBefore(m), d.history) && R.all(h => h[0].isAfter(m) || h[1] > 0, d.history), data))
      const root = tree(stratify(R.sortBy(R.prop('id'), dataTree)))
      
      const timeScaling = (d, x) => {
        return (d.data.history === undefined) ? x : d3.zoomIdentity.scale(d3.scaleLinear().domain([1, 1 + datesMax.diff(datesMin)]).range([.6, 2.6])(1 + m.diff(d.data.history[0][0]))).apply(x)
      }
      
      // hover nodes and edges
      const hoverNode = (node) => {
        $(`.edge[data-id="${$(node).data('id')}"]`).clone().appendTo('.svg-hover')
        const hoveredNode = $(node).clone().appendTo('.svg-hover')
        const circle = $(hoveredNode).find('circle').attr('r', 5)
        $(circle).clone().addClass('background').insertBefore($(hoveredNode).find('text'))
        $(hoveredNode).on('mouseout', () => $('.svg-hover').children().remove())
      }
      
      // draw edges
      const computePath = d => {
        const [x, y] = timeScaling(d, project(d.x, d.y))
        const [parentX, parentY] = project(d.parent.x, d.parent.y)
        const a = (angle(parentX, parentY) + 2 * Math.PI) % (2 * Math.PI)
        const b = (angle(x - parentX, y - parentY) + 2 * Math.PI) % (2 * Math.PI)
        const angleDiff = (b - a + 5 * Math.PI) % (2 * Math.PI) - Math.PI
        const angleDiffSqrt = Math.sign(angleDiff) * Math.sqrt(Math.abs(angleDiff))
        const distToParent = length(x - parentX, y - parentY)
        const parentLength = length(parentX, parentY)
        const k = angleDiffSqrt * distToParent / Math.min(window.width, window.height) * 160 / parentLength
        const dParentX = parentX - k * parentY
        const dParentY = parentY + k * parentX
        return `M${x} ${y} C${x} ${y}, ${dParentX} ${dParentY}, ${parentX} ${parentY}`
      }
      const computeOpacity = d => {
        const [x, y] = timeScaling(d, project(d.x, d.y))
        const [parentX, parentY] = project(d.parent.x, d.parent.y)
        return .1 + 1 / length(x - parentX, y - parentY) * Math.min(window.width, window.height)/ 15
      }
      const edge = svg
        .selectAll('.edge')
        .data(R.filter(d => d.data.key !== undefined && d.data.value !== undefined, root.descendants()), d => d.data.id)
      edge
        .enter()
        .append('path')
          .style('opacity', 0)
          .attr('data-id', d => d.id)
          .classed('edge', true)
          .attr('d', computePath)
      edge
        .exit()
        .remove()
      d3.timeout(() => {
        svg.selectAll('.edge')
          .style('opacity', computeOpacity)
      }, animationDuration + 2 * animationDelay)
      
      // animate edges
      d3.timeout(() => {
        svg.selectAll('.edge')
          .transition()
          .duration(animationDuration)
          .attr('d', computePath, animationDelay)
          .style('opacity', computeOpacity)
      })
      
      // draw nodes
      const node = svg
        .selectAll('.node')
        .data(R.filter(d => d.data.key !== undefined, root.descendants()), d => d.data.id)
      const nodeG = node
        .enter()
        .append('g')
          .style('opacity', 0)
          .attr('data-id', d => d.id)
          .classed('node', true)
          .classed('node-internal', d => d.children)
          .classed('node-leaf', d => !d.children)
          .classed('event', d => d.data.value !== undefined && R.any(h => (h[0].isAfter(lastRedraw) && h[0].isSameOrBefore(m)) || h[0].isAfter(m) && h[0].isSameOrBefore(lastRedraw), d.data.history))
          .attr('transform', d => 'translate(' + timeScaling(d, project(d.x, d.y)) + ')')
      nodeG
        .append('text')
          .text(d => (d.data.value) ? d.data.value : d.data.key)
          .attr('dy', '.31em')
          .attr('x', d => !d.children ? 6 : -6)
          .style('text-anchor', d => !d.children ? 'start' : 'end')
          .attr('transform', d => `rotate(${d.x - 90})`)
          .on('mouseover', function() {
            hoverNode($(this).parent())
          })
      nodeG
        .append('circle')
          .attr('r', 2.5)
          .on('mouseover', function() {
            hoverNode($(this).parent())
          })
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
            .attr('transform', d => `translate(${timeScaling(d, project(d.x, d.y))})`)
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
      width: .8 * Math.min(width, height),
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
      infoLibraries: libsDefault.concat([
        libIonRangeSlider,
      ]),
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
