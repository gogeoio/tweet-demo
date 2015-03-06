MapBox =
  componentDidMount: ->
    L.mapbox.accessToken = 'pk.eyJ1IjoibG9raWRnIiwiYSI6IkRfNkpoMHcifQ.m4reSWIhrD5xIJVkrhRAxA'
    map = L.mapbox.map(@refs.mapEl.getDOMNode(), 'lokidg.i7gg619k').setView([-11.372, -57.634], 5)

module.exports = MapBox
