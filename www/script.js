const sliderTime = settings => {
  settings = Object.assign({}, {
    min: null,
    max: null,
    from: null,
    fromFraction: [1, 1],
    callback: m => {},
    width: 100,
  }, settings)
  const slider = $('#timeslider').ionRangeSlider({
    min: settings.min.format('x'),
    max: settings.max.format('x'),
    from: (settings.from) ? settings.from.format('x') : settings.min.format('x') / (settings.fromFraction[0] + settings.fromFraction[1]) * settings.fromFraction[0] + settings.max.format('x') / (settings.fromFraction[0] + settings.fromFraction[1]) * settings.fromFraction[1],
    grid: true,
    force_edges: true,
    hide_min_max: true,
    hide_from_to: true,
    grid_num: 6,
    prettify: n => moment(n, 'x').format('LL'),
    keyboard: true,
    keyboard_step: 2,
    onChange: n => settings.callback(moment(n.from, 'x')),
    onUpdate: n => settings.callback(moment(n.from, 'x')),
  })
  $('#timeslider').data('ionRangeSlider').reset()
  $('#timesliderContainer').css('marginLeft', -settings.width/2)
  $('#timesliderContainer .irs').css('width', settings.width)
}
