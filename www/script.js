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
    playing: false,
    playingHide: true,
    playingSpeed: 30,
    playingInterval: 30,
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
  if (settings.label) {
    $('<div>' + settings.label + '</div>').css({
      position: 'absolute',
      width: settings.width,
      textAlign: 'center',
      fontSize: 11,
      color: '#999',
      top: 4,
    }).appendTo('#timeslider')
  }
  var intervalTimer = null
  const stopPlaying = () => {
    settings.playing = false
    initPlaying()
  }
  const initPlaying = () => {
    $('.timesliderPlaying').text(settings.playing ? 'stop' : 'play')
    if (settings.playing) intervalTimer = setInterval(() => {
      if (sliderIncrementFrom(settings.playingSpeed)) stopPlaying()
    }, settings.playingInterval)
    else clearInterval(intervalTimer)
  }
  if (!settings.playingHide) {
    $('<a href="" class="timesliderPlaying"></a>').css({
      position: 'absolute',
      width: settings.width,
      textAlign: 'right',
      fontSize: 11,
      color: '#7eaacd',
      top: 4,
    }).appendTo('#timeslider').on('click', event => {
      event.preventDefault()
      settings.playing = !settings.playing
      initPlaying()
    })
  }
  initPlaying()
}
