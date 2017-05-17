$(document).ready(() => {
  d3.json('../data/osmstats.json', datasetJson => {
    // prepare the data
    const dataset = R.compose(
        R.values,
        R.mapObjIndexed(derive(['nodes', 'relations', 'drelations', 'ways', 'users'])),
        R.filter(d => d.timestamp && d.timestamp.isValid())
      )(d3.csvParse(datasetJson.data, d => ({
      timestamp: moment(d['Day of Month'], 'DD/MM/YYYY'),
      nodes: parseCsvInt(d['Nodes (Accum.)']),
      relations: parseCsvInt(d['Number of relations (Accum.)']),
      ways: parseCsvInt(d['Ways (Accum.)']),
      users: parseCsvInt(d['Users']),
    })))
    
    // timeline
    const timeline = new TimelineYears({
      data: dataset,
      getData: null,
      marginLeft: null,
      marginTop: null,
    })
    
    // options panel
    new OptionsPanel({
      elements: [
        {
          type: 'radio',
          name: 'data',
          values: {
            dnodes: {label: 'new nodes per day', selected: true},
            dways: 'new ways per day',
            drelations: 'new relations per day',
            dusers: 'new users per day',
            nodes: 'nodes',
            ways: 'ways',
            relations: 'relations',
            nodesWays: 'ratio nodes to ways',
            nodesRelations: 'ratio nodes to relations',
            waysRelations: 'ratio ways to relations',
            users: 'users',
            nodesUsers: 'nodes per user',
            waysUsers: 'ways per user',
            relationsUsers: 'relations per user',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'select',
          name: 'scale',
          values: {
            linear: {label: 'linear scale', selected: true},
            logarithmic: 'logarithmic scale',
            sqrt: 'square root scale',
          },
        },
        {
          type: 'gap',
        },
        {
          type: 'checkbox',
          name: 'ignoreUpperValuesInScale',
          label: 'ignore outliers in scaling',
          selected: true,
        },
      ],
      onStoreUpdate: store => {
        var getData = null
        switch (store.data) {
          case 'nodes':
            getData = d => d.nodes
            break
          case 'ways':
            getData = d => d.ways
            break
          case 'relations':
            getData = d => d.relations
            break
          case 'nodesWays':
            getData = d => (d.ways > 0) ? d.nodes / d.ways : null
            break
          case 'nodesRelations':
            getData = d => (d.relations > 0) ? d.nodes / d.relations : null
            break
          case 'waysRelations':
            getData = d => (d.relations > 0) ? d.ways / d.relations : null
            break
          case 'users':
            getData = d => d.users
            break
          case 'nodesUsers':
            getData = d => (d.users > 0) ? d.nodes / d.users : null
            break
          case 'waysUsers':
            getData = d => (d.users > 0) ? d.ways / d.users : null
            break
          case 'relationsUsers':
            getData = d => (d.users > 0) ? d.relations / d.users : null
            break
          case 'dnodes':
            getData = d => d.dnodes
            break
          case 'dways':
            getData = d => d.dways
            break
          case 'drelations':
            getData = d => d.drelations
            break
          case 'dusers':
            getData = d => d.dusers
            break
        }
        timeline.changeOptions({
          getData: getData,
          scale: store.scale,
          ignoreUpperValuesInScale: (store.ignoreUpperValuesInScale) ? .02 : null,
        })
      },
    })
    
    // page
    initPage({
      infoDescription: 'The OSM database is constantely growing, and an increasing number of community users are adding nodes, ways, and relations every day. This visualization explores how the OSM database has developed over time. The data reveals, besides the historical development of the database, some annual and monthly patterns.',
      infoIdea: [franzBenjaminMocnik],
      infoProgramming: [franzBenjaminMocnik],
      infoData: [
        datasetJson,
      ],
      infoLibraries: libsDefault.concat([
        {name: 'Example by M. Bostock', url: 'http://bl.ocks.org/mbostock/4063318'},
        libD3ScaleChromatic,
      ]),
      init: () => {
        initTooltip({
          selector: '.timelineYears-day:nth-child(420)',
          text: 'There is no data available for some days. In this case, the corresponding boxes are coloured in gray/white.',
          positionMy: 'bottom left',
          positionAt: 'top center',
        })
        initTooltip({
          selector: 'select[name="scale"]',
          text: 'Try different scales, when the diagram does not show different colours. This will help you to distinguish the values better.',
          positionMy: 'bottom left',
          positionAt: 'top center',
        })
        initTooltip({
          selector: 'input[name="data"]:first',
          text: 'Choose different data values to compare.',
          positionMy: 'bottom left',
          positionAt: 'top center',
        })
        initTooltip({
          selector: '.timelineYears-gradient',
          text: 'This legend provides information about how the colour in the diagram decodes values. Observe that the scale is constantly changing when viewing differnt datasets at different scales.',
          positionMy: 'top left',
          positionAt: 'bottom center',
        })
        initTooltip({
          selector: 'input[name="ignoreUpperValuesInScale"]',
          text: 'Often only some values are very high while the others are in a smaller range. Such outliers can be visually filtered away by ignoring them during the scaling, making the outliers visually indistinguishable from other large values.',
        })
      },
    })
  })
})
