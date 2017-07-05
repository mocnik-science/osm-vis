const visData = {
  dataTimestamp: '2016-2017',
  dataDescription: 'Produced at the <a href="http://www.geog.uni-heidelberg.de/gis/index_en.html" target="_blank">GIScience Research Group</a> at the Heidelberg University',
  dataSource: '<a href="https://github.com/mocnik-science/osm-vis/blob/master/LICENSE.md" target="_blank">GPL-3</a>',
  dataUrl: 'http://github.com/mocnik-science/osm-vis',
}

const franzBenjaminMocnik = {name: 'Franz-Benjamin Mocnik', url: 'http://www.mocnik-science.net'}
const alexanderZipf = {name: 'Alexander Zipf', url: 'http://www.geog.uni-heidelberg.de/personen/gis_zipf.html'}
const martinRaifer = {name: 'Martin Raifer', url: 'mailto:martin@raifer.tech'}

const libD3 = {name: 'D3.js', url: 'http://d3js.org'}
const libD3Cloud = {name: 'D3-cloud', url: 'http://github.com/jasondavies/d3-cloud'}
const libD3ScaleChromatic = {name: 'D3-scale-chromatic', url: 'http://github.com/d3/d3-scale-chromatic'}
const libMoment = {name: 'Moment.js', url: 'http://momentjs.com'}
const libMomentRound = {name: 'Moment-round', url: 'http://github.com/WebDevTmas/moment-round'}
const libTopoJSON = {name: 'TopoJSON', url: 'http://github.com/topojson/topojson'}
const libLeaflet = {name: 'Leaflet', url: 'http://leafletjs.com'}
const libRamda = {name: 'Ramda', url: 'http://ramdajs.com'}
const libJQuery = {name: 'jQuery', url: 'http://jquery.com'}
const libQTip2 = {name: 'qTip2', url: 'http://qtip2.com'}
const libIonRangeSlider = {name: 'Ion.RangeSlider', url: 'http://ionden.com/a/plugins/ion.rangeSlider/en.html'}
const libsDefault = [libD3, libMoment, libRamda, libJQuery, libQTip2]

const heigitDB = () => {
  return {
    dataTimestamp: moment().format(),
    dataDescription: 'data fetched from the HeiGIT HistoryDB database',
    dataSource: 'OpenStreetMap project,<br><a href="http://www.openstreetmap.org/copyright" target="_blank">various licenses (depending on time of contribution)</a>',
    dataUrl: 'http://heigit.org',
  }
}

/* COLOURS */

const colorPrimaryDark = '#4682b4'
const colorPrimaryLight = '#a3c2db'

/* HELPING FUNCTIONS */
const range = (start, stop, step) => R.map(n => start + n * step, R.range(0, Math.ceil((stop - start) / step)))

/* LOGO */
$(document).ready(() => {
  const logo = $('.logo').append('<span class="logo-first">OSM</span><span class="logo-second">vis</span>')
  $('.logo').after(logo.clone())
})

/* SVG */
const pageFixed = (width, height, offsetX, offsetY) => {
  return d3.select('body')
    .append('div')
      .classed('svg', true)
      .style('top', `${(window.innerHeight - height) / 2 + offsetY}px`)
      .style('left', `${(window.innerWidth - width) / 2 + offsetX}px`)
    .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
}

/* DATA */
const parseCsvInt = v => ((v !== null && v !== undefined && v.length) ? +v : null)
const derive = attrs => (d, n, a) => {
  n = parseInt(n)
  const dAttr = attr => d[`d${attr}`] = (d[attr] !== null && a[n + 1][attr] !== null) ? a[n + 1][attr] - d[attr] : null
  if (n < a.length - 1 && a[n + 1].timestamp.diff(d.timestamp, 'days') == 1) {
    if (R.is(Array, attrs)) R.forEach(dAttr, attrs)
    else dAttr(attrs)
  } else {
    if (R.is(Array, attrs)) R.forEach(attr => d[`d${attr}`] = null, attrs)
    else d[`d${attrs}`] = null
  }
  return d
}

/* SLIDER TIME */
class SliderTime {
  constructor(options) {
    options = this.options = R.merge({
      min: null,
      max: null,
      from: null,
      fromMin: null,
      fromMax: null,
      fromFraction: [1, 1],
      step: 1,
      toInternal: m => (m instanceof moment) ? m.unix() : m,
      fromInternal: n => moment.unix(n),
      formatShow: 'LL',
      show: m => m.format(options.formatShow),
      callback: m => {},
      width: 100,
      label: null,
      labelLeft: null,
      playing: false,
      playingHide: true,
      playingSpeed: 1,
      playingFrameRate: 30,
      playingRestartOnEnd: true,
    }, options)
    const _optionsInternal = this._optionsInternal = {
      min: options.toInternal(options.min),
      max: options.toInternal(options.max),
      from: (options.from) ? options.toInternal(options.from) : options.toInternal(options.min) / (options.fromFraction[0] + options.fromFraction[1]) * options.fromFraction[0] + options.toInternal(options.max) / (options.fromFraction[0] + options.fromFraction[1]) * options.fromFraction[1],
      from_min: (options.fromMin) ? options.toInternal(options.fromMin) : false,
      from_max: (options.fromMax) ? options.toInternal(options.fromMax) : false,
      grid: true,
      force_edges: true,
      hide_min_max: true,
      hide_from_to: true,
      grid_num: 6,
      step: options.step,
      prettify: n => options.show(options.fromInternal(n)),
      keyboard: true,
      keyboard_step: 2,
      onChange: n => {
        this.stopPlaying()
        if (options.callback) options.callback(options.fromInternal(n.from))
      },
      onUpdate: n => (options.callback) ? options.callback(options.fromInternal(n.from)) : null,
    }
    this._intervalTimer = null
    $('<input type="text" id="timesliderElement">').appendTo('#timeslider').ionRangeSlider(_optionsInternal)
    const slider = this._slider = $('#timesliderElement').data('ionRangeSlider')
    slider.reset()
    $('#timeslider').css('marginLeft', -options.width/2)
    $('#timeslider .irs').css('width', options.width)
    if (options.label) $('<div class="timesliderLabel">' + options.label + '</div>').appendTo('#timeslider')
    if (options.labelLeft) $('<div class="timesliderLabelLeft">' + options.labelLeft + '</div>').appendTo('#timeslider')
    if (!options.playingHide) {
      $('<div class="timesliderPlaying"></div>').appendTo('#timeslider').on('click', event => {
        event.preventDefault()
        this.togglePlaying()
      })
    }
    this._initPlaying()
  }
  setCallback(callback) {
    this.options.callback = callback
    this._optionsInternal.onUpdate(this._slider.result)
    return this
  }
  setFrom(x) {
    const slider = this._slider
    this._slider.result.from = this.options.toInternal(x)
    slider.options.from = slider.result.from
    const w = (slider.options.max - slider.options.min) / 100
    const f = (slider.result.from - slider.options.min) / w
    slider.coords.p_single_real = slider.toFixed(f)
    slider.coords.p_single_real = slider.checkDiapason(slider.coords.p_single_real, slider.options.from_min, slider.options.from_max);
    slider.coords.p_single_fake = slider.convertToFakePercent(slider.coords.p_single_real);
    slider.coords.p_bar_x = slider.coords.p_handle / 2
    slider.coords.p_bar_w = slider.coords.p_single_fake
    $('.irs-bar').css({
      left: slider.coords.p_bar_x + '%',
      width: slider.coords.p_bar_w + '%',
    })
    $('.irs-slider').css({
      left: slider.coords.p_bar_w + '%',
    })
    slider.options.onUpdate(slider.result)
    return this
  }
  _sliderIncrementFrom(dFrom) {
    var isAtMax = false
    this._slider.result.from += dFrom
    if (this._slider.result.from >= ((this._optionsInternal.from_max) ? this._optionsInternal.from_max : this._optionsInternal.max)) {
      if (this.options.playingRestartOnEnd) this._slider.result.from = (this._optionsInternal.from_min) ? this._optionsInternal.from_min : this._optionsInternal.min
      else {
        isAtMax = true
        this._slider.result.from = (this._optionsInternal.from_max) ? this._optionsInternal.from_max : this._optionsInternal.max
      }
    }
    this.setFrom(this._slider.result.from)
    return isAtMax
  }
  _initPlaying() {
    $('.timesliderPlaying').text(this.options.playing ? 'stop' : 'play')
    if (this.options.playing) this._intervalTimer = setInterval(() => {
      if (this._sliderIncrementFrom(this.options.playingSpeed * this.options.playingFrameRate)) this.stopPlaying()
    }, this.options.playingInterval)
    else clearInterval(this._intervalTimer)
  }
  startPlaying() {
    this.options.playing = true
    this._initPlaying()
    return this
  }
  stopPlaying() {
    this.options.playing = false
    this._initPlaying()
    return this
  }
  togglePlaying() {
    this.options.playing = !this.options.playing
    this._initPlaying()
    return this
  }
}

/* DATA TOOLTIP */
const initDataTooltip = () => {
  d3.select('body').append('div')
    .classed('data-tooltip', true)
    .style('opacity', 0)
}
const showDataTooltip = (left, top, title, text) => {
  $('.data-tooltip').html(`<h3>${title}</h3><div>${text}</div>`)
  d3.select('.data-tooltip').transition()
    .style('left', (left + 8) + 'px')
    .style('top', Math.min(top - 16, window.innerHeight - $('.data-tooltip').outerHeight() - 4) + 'px')
    .duration(200)
    .style('opacity', .9)
}
const hideDataTooltip = () => {
  d3.select('.data-tooltip').transition()
    .duration(200)
    .style('opacity', 0)
}

/* INFORMATION */
const initTooltip = options => {
  options = R.merge({
    selector: null,
    text: '',
    positionMy: 'top left',
    positionAt: 'bottom center',
    showOnInformation: true,
  }, options)
  if (!options.selector) return
  if (options.showOnInformation) $(options.selector).addClass('showOnInformation')
  $(options.selector).qtip({
    content: {
      text: options.text,
    },
    style: {
      classes: 'qtip-rounded qtip-info qtip-shadow',
    },
    position: {
      my: options.positionMy,
      at: options.positionAt,
    },
    show: {
      event: null,
      effect: function(offset) {
        $(this).fadeIn(300)
      },
    },
    hide: {
      event: null,
      effect: function(offset) {
        $(this).fadeOut(300)
      },
    },
  })
  return $(options.selector)
}
const initPage = options => {
  options = Object.assign({}, {
    infoDescription: '',
    infoIdea: [],
    infoProgramming: [],
    infoData: [],
    infoLibraries: [],
    init: () => {},
    onInfoShow: () => {},
    onInfoHide: () => {},
  }, options)
  if (!Array.isArray(options.infoDescription)) options.infoDescription = [options.infoDescription]
  $('<a class="back" href="../">back</a>').appendTo('body')
  var isShowInfo = false
  const formatTimestamp = t => {
    const m = moment(t, '%YYYY-%MM-%DDT%HH:%mm:%ss%Z')
    return (m.isValid()) ? m.format('YYYY-MM-DD') : t
  }
  const makeList = (caption, l, f, options={}) => {
    options = Object.assign({}, {
      multirow: false,
    }, options)
    return (l.length == 0) ? '' : `
      <dt>${caption}</dt>
      <dd>
        <ul class="${(options.multirow) ? 'multirow' : ''}">
          ${l.map(person => `<li>${f(person)}</li>`).join('')}
        </ul>
      </dd>
    `
  }
  const personList = (caption, l, options) => makeList(caption, l, person => (person.url) ? `<a href="${person.url}" target="_blank">${person.name}</a>` : person.name, options)
  const dataList = (caption, l, options) => makeList(caption, l, d => `<span class="data-description">${d.dataDescription}</span><br><span class="data-second"><span class="data-timestamp">(${formatTimestamp(d.dataTimestamp)})</span><span class="data-source">${d.dataSource}</span><br><span class="data-url"><a href="${d.dataUrl}" target="_blank">${d.dataUrl}</a></span></span>`, options)
  const libraryList = (caption, l, options) => makeList(caption, R.sortBy(R.prop('name'), l), d => `<a href="${d.url}" target="_blank">${d.name}</a>`, options)
  const content = `
    <h3>Description</h3>
    ${options.infoDescription.map(p => `<p>${p}</p>`).join('')}
    <dl class="info-bottom info-small">
      ${personList('Idea', options.infoIdea)}
      ${personList('Programming', options.infoProgramming)}
      ${dataList('Visualization', [visData])}
      ${dataList('Datasets', options.infoData)}
      ${libraryList('Libraries', options.infoLibraries, {
        multirow: true,
      })}
    </dl>
  `
  const hideInfo = event => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    isShowInfo = false
    $('.info').removeClass('info-show')
    $('.showOnInformation').each((j, n) => $(n).qtip('api').hide())
    options.onInfoHide()
    $('.overlay').fadeOut(300, function() {
      $(this).remove()
    })
  }
  $('<div class="info"><span class="info-close">x</span><span class="info-symbol">?</span><span class="info-content">' + content + '</span></div>')
    .on('click', function(event) {
      $('.info').qtip('api').hide()
      if (isShowInfo) return
      event.preventDefault()
      $('.showOnInformation').each((j, n) => $(n).qtip('api').destroy()).removeClass('showOnInformation')
      options.init()
      isShowInfo = !isShowInfo
      $('<div class="overlay"></div>').on('click', hideInfo).appendTo('body').fadeIn(300)
      $(this).addClass('info-show')
      $('.showOnInformation').each((j, n) => $(n).qtip('api').show())
      options.onInfoShow()
      $('.qtip-content').on('click', hideInfo)
    }).appendTo('body')
  initTooltip({
    selector: '.info',
    text: 'Show Information.',
    positionMy: 'top right',
    positionAt: 'bottom center',
    showOnInformation: false,
  })
  $('.info').qtip('api').show()
  $('.info-close').on('click', hideInfo)
}

/* OPTIONS PANEL */
class OptionsPanel {
  constructor(options) {
    options = R.merge({
      elements: [],
      onStoreUpdate: () => {},
    }, options)
    const optionsPanel = $('<div class="panel"></div>').appendTo($('body'))
    
    var store = {}
    const updateStore = (keyValues, raiseOnStoreUpdate=true) => {
      store = R.merge(store, keyValues)
      if (raiseOnStoreUpdate) options.onStoreUpdate(store)
    }
    
    const getPairs = x => (x instanceof Array) ? x : R.toPairs(x)
    const loop = (f, x) => {
      if (x instanceof Array) R.forEach(keyData => f(keyData[0], keyData[1]), x)
      else R.forEachObjIndexed((data, key) => f(key, data), x)
    }
    
    const addDivider = () => $('<hr>').appendTo(optionsPanel)
    const addGap = () => $('<div class="gap"></div>').appendTo(optionsPanel)
    const addRadio = element => {
      updateStore({[element.name]: R.compose(R.head, R.head, R.filter(([k, element]) => R.is(Object, element) && element.selected))(getPairs(element.values))}, false)
      loop((key, data) => {
        $(`<div><label><input type="radio" name="${element.name}" value="${key}" ${(!R.is(String, data) && data.selected) ? 'checked="checked"' : ''}>${R.is(String, data) ? data : data.label}</label></div>`)
          .appendTo(optionsPanel)
          .find('input')
          .on('click', function() {
            updateStore({[element.name]: $(this).val()})
          })
      }, element.values)
    }
    const addSelect = element => {
      updateStore({[element.name]: R.compose(R.head, R.head, R.filter(([k, element]) => R.is(Object, element) && element.selected), R.toPairs)(element.values)}, false)
      $(`<div><select name="${element.name}">` + R.compose(R.join(''), R.values, R.mapObjIndexed((data, value) => `<option value="${value}" ${(R.prop('selected', data)) ? 'selected="selected"' : ''}>${R.is(String, data) ? data : data.label}</option>`))(element.values) + '</select></div>')
        .appendTo(optionsPanel)
        .on('click', function() {
          updateStore({[element.name]: $(this).find('select').val()})
        })
    }
    const addCheckbox = element => {
      updateStore({[element.name]: (element.selected !== undefined && element.selected)}, false)
      $(`<div><label><input type="checkbox" name="${element.name}" ${(element.selected !== undefined && element.selected) ? 'checked="checked"' : ''}>${element.label}</label></div>`)
        .appendTo(optionsPanel)
        .on('click', function() {
          updateStore({[element.name]: $(this).find('input').is(':checked')})
        })
    }
    
    R.forEach(element => {
      if (element.type == 'divider') addDivider()
      if (element.type == 'gap') addGap()
      if (element.type == 'radio') addRadio(element)
      if (element.type == 'select') addSelect(element)
      if (element.type == 'checkbox') addCheckbox(element)
    }, options.elements)
    options.onStoreUpdate(store)
  }
}

/* TIMELINE YEARS */
class TimelineYears {
  constructor(options) {
    this.options = options = R.merge({
      getData: null,
      scale: 'linear',
      ignoreUpperValuesInScale: .02,
      data: null,
      width: .6 * window.innerWidth,
      height: .8 * window.innerHeight,
      marginLeft: 0,
      marginTop: 0,
      gapRatio: .2,
      labelYear: true,
      labelMonth: true,
      animationDuration: 300,
    }, options)
    // start end and end date
    const startDate = R.head(options.data).timestamp
    const endDate = R.last(options.data).timestamp
    const years = endDate.year() - startDate.year() + 1
    // temporal constants
    const daysPerWeek = this.daysPerWeek = 7
    const monthsPerYear = this.monthsPerYear = 12
    const maxWeeksPerYear = this.maxWeeksPerYear = 53
    // try horizontally matching layout
    const hWeekSize = options.height / (years + (years - 1) * options.gapRatio)
    // try vertically matching layout
    const wDaySize = options.width / maxWeeksPerYear
    const wWeekSize = wDaySize * daysPerWeek
    // decide the layout
    const weekSize = Math.min(hWeekSize, wWeekSize)
    const daySize = this.daySize = weekSize / daysPerWeek
    const yearGap = weekSize * options.gapRatio
    // compute svg size
    const svgWidth = daySize * maxWeeksPerYear
    const svgHeight = weekSize * (years * (1 + options.gapRatio) - options.gapRatio)
    // prepare data
    const startYear = startDate.year()
    R.forEach(d => {
      d.x = this._weekOfYear(d.timestamp) * daySize
      d.y = this._dayOfWeek(d.timestamp) * daySize + (d.timestamp.year() - startYear) * (weekSize + yearGap)
    }, options.data)
    const dataDays = d3.timeDays(d3.timeYear(startDate), d3.timeYear.offset(d3.timeYear(endDate)))
    R.forEach(d => {
      d.x = this._weekOfYear(d) * daySize
      d.y = this._dayOfWeek(d) * daySize + (d.getFullYear() - startYear) * (weekSize + yearGap)
    }, dataDays)
    // draw
    const legendWidth = 30
    const legendHeight = 200
    const legendSvg = d3.select('body')
      .append('div')
        .classed('timelineYears-legend', true)
        .style('width', legendWidth)
        .style('height', legendHeight)
      .append('svg')
        .style('width', legendWidth)
        .style('height', legendHeight)
    legendSvg.append('defs')
      .append('linearGradient')
        .attr('id', 'timelineYears-gradient')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', 1)
    legendSvg.append('rect')
      .classed('timelineYears-gradient', true)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#timelineYears-gradient)')
    legendSvg.append('text')
      .classed('timelineYears-upper', true)
      .attr('x', legendWidth + 10)
      .attr('y', 10)
    legendSvg.append('text')
      .classed('timelineYears-lower', true)
      .attr('x', legendWidth + 10)
      .attr('y', legendHeight - 2)
    this.svg = pageFixed(svgWidth, svgHeight, (options.marginLeft !== null) ? options.marginLeft : 0, (options.marginRight !== null) ? options.marginRight : 0)
    this.svg
      .append('g')
      .selectAll('.timelineYears-day1')
      .data(dataDays, d => [d.x, d.y])
      .enter()
      .append('rect')
      .classed('timelineYears-day1', true)
      .attr('x', day => day.x)
      .attr('y', day => day.y)
      .attr('width', daySize)
      .attr('height', daySize)
    this.svg
      .append('g')
      .selectAll('.timelineYears-day2')
      .data(dataDays, d => [d.x, d.y])
      .enter()
      .append('polygon')
      .classed('timelineYears-day2', true)
      .attr('transform', day => `translate(${day.x}, ${day.y})`)
      .attr('points', `0 0, ${daySize} 0, 0 ${daySize}`)
    this.svg
      .append('g')
      .selectAll('.timelineYears-day')
      .data(dataDays, d => [d.x, d.y])
      .enter()
      .append('rect')
      .classed('timelineYears-day', true)
      .attr('x', day => day.x)
      .attr('y', day => day.y)
      .attr('width', daySize)
      .attr('height', daySize)
      .attr('fill-opacity', 0)
    this.year = this.svg
      .selectAll('.timelineYears-year')
      .data(d3.timeYears(d3.timeYear.floor(startDate), d3.timeYear.ceil(endDate)))
      .enter()
      .append('g')
        .classed('timelineYears-year', true)
        .attr('transform', (year, i) => `translate(0, ${i * (weekSize + yearGap)})`)
    this.year
      .selectAll('.timelineYears-month')
      .data(year => d3.timeMonths(year, d3.timeYear.offset(year)))
      .enter()
      .append('path')
        .classed('timelineYears-month', true)
        .attr('d', day => {
          const dayEnd = d3.timeDay.offset(d3.timeMonth.offset(day), -1)
          const d0x = this._weekOfYear(day)
          const d0y = this._dayOfWeek(day)
          const d1x = this._weekOfYear(dayEnd, day)
          const d1y = this._dayOfWeek(dayEnd)
          return `M${[d0x * daySize, d0y * daySize]} H${(d0x + 1) * daySize} V0 H${(d1x + 1) * daySize} V${(d1y + 1) * daySize} H${d1x * daySize} V${7 * daySize} H${d0x * daySize} Z`
        })
    if (options.labelYear) {
      this.year
        .append('text')
          .classed('timelineYears-labelYear', true)
          .style('text-anchor', 'middle')
          .attr('transform', d => `translate(${-daySize}, ${daySize * daysPerWeek / 2}) rotate(-90)`)
          .text(year => moment(year).year())
    }
    if (options.labelMonth) {
      this.svg
        .select('.timelineYears-year')
        .selectAll('.labelMonth')
        .data(year => d3.timeMonths(year, d3.timeYear.offset(year)))
        .enter()
          .append('text')
            .classed('timelineYears-labelMonth', true)
            .style('text-anchor', 'middle')
            .attr('x', day => (this._weekOfYear(day) + this._weekOfYear(d3.timeDay.offset(d3.timeMonth.offset(day), -1), day) + 1.8) / 2 * daySize)
            .attr('y', -.8 * daySize)
            .text(day => moment(day).format('MMM'))
    }
    if (options.getData) this.changeOptions({})
  }
  _dayOfWeek(day) {
    return d3.timeDay.count(d3.timeMonday(day), day)
  }
  _weekOfYear(day, dayYear=null) {
    return d3.timeMonday.count(d3.timeYear((dayYear) ? dayYear : day), day)
  }
  _scale() {
    switch (this.options.scale) {
      case 'linear':
        return {
          f: x => x,
          min: 0,
        }
      case 'logarithmic':
        return {
          f: x => (x > 0) ? Math.log(x) : null,
          min: 1,
        }
      case 'sqrt':
        return {
          f: Math.sqrt,
          min: 0,
        }
    }
  }
  changeOptions(options) {
    if (R.compose(R.length, R.difference(['getData', 'scale', 'ignoreUpperValuesInScale']), R.keys)(options) > 0) console.error('[TimelineYears] Cannot only change options \'getData\', \'scale\', and \'ignoreUpperValuesInScale\'.')
    options = this.options = R.merge(this.options, options)
    options.data = R.map(d => {
      const dFill = options.getData(d)
      d.fill = (dFill) ? dFill : null
      return d
    }, options.data)
    
    const maxFillValues = R.compose(R.reverse, R.sortBy(R.identity), R.filter(R.complement(R.isNil)), R.pluck('fill'))(options.data)
    const maxFill = R.compose(R.apply(Math.max), R.slice(Math.floor(options.ignoreUpperValuesInScale * maxFillValues.length), Infinity))(maxFillValues)
    const scale = this._scale()
    options.data = R.map(d => {
      (d.fill !== null) ? d.fill = scale.f(d.fill) / scale.f(maxFill) : null
      return d
    }, options.data)
    d3.selectAll('.timelineYears-day')
      .data(options.data, d => [d.x, d.y])
      .transition()
      .attr('fill', d => (d.fill !== null) ? d3.interpolateYlGnBu(d.fill) : '#fff')
      .attr('fill-opacity', d => (d.fill !== null) ? 1 : 0)
      .duration(options.animationDuration)
    d3.select('.timelineYears-lower').text(scale.min)
    d3.select('.timelineYears-upper').text(`${d3.format(',.2r')(maxFill)}+`)
    d3.select('.timelineYears-legend').select('linearGradient')
      .selectAll('stop')
      .data(R.map(i => [i, d3.interpolateYlGnBu(1 - i)], range(0, 1, .01)))
      .enter()
      .append('stop')
        .attr('offset', ([i, c]) => `${i * 100}%`)
        .attr('stop-color', ([i, c]) => c)
  }
}

/* MAP */
const mapPreventDrag = id => {
  const div = L.DomUtil.get(id)
  if (!L.Browser.touch) {
    L.DomEvent.disableClickPropagation(div)
    L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation)
  } else {
    L.DomEvent.on(div, 'click', L.DomEvent.stopPropagation)
  }
}

/* TOPOJSON */
if (topojson) {
  topojson.getBounds = json => {
    const [b, a, d, c] = topojson.bbox(json)
    return [[a, b], [c, d]]
  }
  topojson.getObject = json => Object.values(json.objects)[0]
}
