const visData = {
  dataTimestamp: '2016-2017',
  dataDescription: 'Produced at the <a href="http://www.geog.uni-heidelberg.de/gis/index_en.html" target="_blank">GIScience Research Group</a> at the Heidelberg University',
  dataSource: '<a href="https://github.com/mocnik-science/osm-vis/blob/master/LICENSE.md" target="_blank">GPL-3</a>',
  dataUrl: 'http://github.com/mocnik-science',
}

const franzBenjaminMocnik = {name: 'Franz-Benjamin Mocnik', url: 'http://www.mocnik-science.net'}
const alexanderZipf = {name: 'Alexander Zipf', url: 'http://www.geog.uni-heidelberg.de/personen/gis_zipf.html'}

const libD3 = {name: 'D3.js', url: 'http://d3js.org'}
const libMoment = {name: 'Moment.js', url: 'http://momentjs.com'}
const libMomentRound = {name: 'Moment-round', url: 'http://github.com/WebDevTmas/moment-round'}
const libTopoJSON = {name: 'TopoJSON', url: 'http://github.com/topojson/topojson'}
const libLeaflet = {name: 'Leaflet', url: 'http://leafletjs.com'}
const libUnderscore = {name: 'Underscore.js', url: 'http://underscorejs.org'}
const libJQuery = {name: 'jQuery', url: 'http://jquery.com'}
const libQTip2 = {name: 'qTip2', url: 'http://qtip2.com'}
const libIonRangeSlider = {name: 'Ion.RangeSlider', url: 'http://ionden.com/a/plugins/ion.rangeSlider/en.html'}

/* SLIDER TIME */
const sliderTime = settings => {
  settings = Object.assign({}, {
    min: null,
    max: null,
    from: null,
    fromMin: null,
    fromMax: null,
    fromFraction: [1, 1],
    step: 1,
    toInternal: m => m.unix(),
    fromInternal: n => moment.unix(n),
    formatShow: 'LL',
    callback: m => {},
    width: 100,
    label: null,
    labelLeft: null,
    playing: false,
    playingHide: true,
    playingSpeed: 1,
    playingFrameRate: 30,
    playingRestartOnEnd: true,
  }, settings)
  const options = {
    min: settings.toInternal(settings.min),
    max: settings.toInternal(settings.max),
    from: (settings.from) ? settings.toInternal(settings.from) : settings.toInternal(settings.min) / (settings.fromFraction[0] + settings.fromFraction[1]) * settings.fromFraction[0] + settings.toInternal(settings.max) / (settings.fromFraction[0] + settings.fromFraction[1]) * settings.fromFraction[1],
    from_min: (settings.fromMin) ? settings.toInternal(settings.fromMin) : false,
    from_max: (settings.fromMax) ? settings.toInternal(settings.fromMax) : false,
    grid: true,
    force_edges: true,
    hide_min_max: true,
    hide_from_to: true,
    grid_num: 6,
    step: settings.step,
    prettify: n => settings.fromInternal(n).format(settings.formatShow),
    keyboard: true,
    keyboard_step: 2,
    onChange: n => {
      stopPlaying()
      settings.callback(settings.fromInternal(n.from))
    },
    onUpdate: n => settings.callback(settings.fromInternal(n.from)),
  }
  $('<input type="text" id="timesliderElement">').appendTo('#timeslider').ionRangeSlider(options)
  const slider = $('#timesliderElement').data('ionRangeSlider')
  const sliderIncrementFrom = dFrom => {
    var isAtMax = false
    slider.result.from += dFrom
    if (slider.result.from >= ((options.from_max) ? options.from_max : options.max)) {
      if (settings.playingRestartOnEnd) slider.result.from = (options.from_min) ? options.from_min : options.min
      else {
        isAtMax = true
        slider.result.from = (options.from_max) ? options.from_max : options.max
      }
    }
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
    return isAtMax
  }
  slider.reset()
  $('#timeslider').css('marginLeft', -settings.width/2)
  $('#timeslider .irs').css('width', settings.width)
  if (settings.label) $('<div class="timesliderLabel">' + settings.label + '</div>').appendTo('#timeslider')
  if (settings.labelLeft) $('<div class="timesliderLabelLeft">' + settings.labelLeft + '</div>').appendTo('#timeslider')
  var intervalTimer = null
  const stopPlaying = () => {
    settings.playing = false
    initPlaying()
  }
  const initPlaying = () => {
    $('.timesliderPlaying').text(settings.playing ? 'stop' : 'play')
    if (settings.playing) intervalTimer = setInterval(() => {
      if (sliderIncrementFrom(settings.playingSpeed * settings.playingFrameRate)) stopPlaying()
    }, settings.playingInterval)
    else clearInterval(intervalTimer)
  }
  if (!settings.playingHide) {
    $('<div class="timesliderPlaying"></div>').appendTo('#timeslider').on('click', event => {
      event.preventDefault()
      settings.playing = !settings.playing
      initPlaying()
    })
  }
  initPlaying()
}

/* INFORMATION */
const initTooltip = options => {
  options = Object.assign({}, {
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
  const libraryList = (caption, l, options) => makeList(caption, l, d => `<a href="${d.url}" target="_blank">${d.name}</a>`, options)
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
    $('.info-close').on('click', hideInfo)
}
