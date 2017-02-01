const width = .8 * window.innerWidth
const height = .8 * window.innerHeight
const largestWordFontSize = 250

$(document).ready(() => {
  d3.json('../data/osm-tags-word-frequency-wiki.json', dataset => {
    // prepare the data
    const prepareFrequency = dataFrequency => {
      const maxCount = R.compose(R.apply(Math.max), R.map(d => d[1]))(dataFrequency)
      return dataFrequency.map(d => ({text: d[0], size: .8 * Math.pow(d[1] / maxCount, 2) * largestWordFontSize}))
    }
    const wordsPerLanguage = R.compose(R.fromPairs, R.unnest, R.map(data => [
      [`${data.language}<span class="subcaption">word counts several times per tag description</span>`, prepareFrequency(data.frequency)],
      [`${data.language}<span class="subcaption">word counts only once per tag description</span>`, prepareFrequency(data.frequencyOnlyOncePerTag)],
    ]))(dataset.wordFrequency)
    
    // draw word cloud
    const fill = d3.scaleOrdinal(d3.schemeCategory20)
    R.forEachObjIndexed((words, lang) => {
      const div = $(`<div class="svg"><h3>${lang}</h3></div>`).appendTo($('body')).css({
        width: width,
        height: height,
      })
      const draw = words => {
        const svg = d3.select($(div).get(0))
          .append('svg')
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`)
          .selectAll('text')
            .data(words)
          .enter()
          .append('text')
            .style('font-size', d => d.size + 'px')
            .style('font-family', 'Impact')
            .style('fill', (d, i) => fill(i))
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
            .text(d => d.text)
      }
      d3.layout.cloud()
        .size([width, height])
        .words(words)
        .rotate(() => Math.random() * 120 - 60)
        .font('Impact')
        .fontSize(d => d.size)
        .on('end', draw)
        .start()
    }, wordsPerLanguage)
    
    // page
    initPage({
      infoDescription: 'The core tags, which are used in OSM to descripe nodes, ways, and relations, are documented in the <a href="https://wiki.openstreetmap.org/wiki/Map_Features" target="_blank">OSM wiki</a>. This documentation serves as an ontology but there is no obligation to not use other tags. This visualization explores the documentation of the tags by showing the words that have been used most in the documentation.',
      infoIdea: [franzBenjaminMocnik],
      infoProgramming: [franzBenjaminMocnik],
      infoData: [
        dataset,
      ],
      infoLibraries: libsDefault.concat([
        libD3Cloud,
      ]),
      init: () => {
        initTooltip({
          selector: '.svg:first g',
          text: 'The size of a word relates to how often it occures in the tag description in the OSM wiki.',
          positionAt: 'center center',
        })
        initTooltip({
          selector: '.subcaption:nth-child(even)',
          text: 'In this word cloud, the importance of a word is computed by counting the total number of appearances in all tag descriptions.',
          positionMy: 'bottom left',
          positionAt: 'top center',
        })
        initTooltip({
          selector: '.subcaption:nth-child(odd)',
          text: 'In this word cloud, the importance of a word is computed by counting in how many tag descriptions a word appears.',
          positionMy: 'bottom left',
          positionAt: 'top center',
        })
      },
    })
  })
})
