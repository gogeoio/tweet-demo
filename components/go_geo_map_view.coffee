React = require('react')
{div} = React.DOM

NavBar = require('./go_geo_map_view/nav_bar.coffee')
MapDashboard = require('./go_geo_map_view/map_dashboard.coffee')

GoGeoMapView = React.createClass
  displayName: 'GoGeoMapView'
  render: ->
    div {className: 'go-geo-container'},
      NavBar()
      MapDashboard()

module.exports = GoGeoMapView
