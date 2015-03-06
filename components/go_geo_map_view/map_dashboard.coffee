React = require('react')
{div} = React.DOM

MapBoxMixin = require('../mixins/mapbox.coffee')

MapDashboard = React.createClass
  displayName: 'GoGeoMapView.MapDashboard'
  mixins: [MapBoxMixin]

  render: ->
    div
      id: 'map'
      ref: 'mapEl'
      className: 'map-dashboard'

module.exports = MapDashboard;
