React = require('react')
Backbone = require('backbone')
{div} = React.DOM

AppRouter = require('./backbone/router')
GoGeoMapView = require('./go_geo_map_view.coffee')
GoGeoPresentation = require('./go_geo_presentation.coffee')

GoGeoTweetsApp = React.createClass
  displayName: 'GoGeoTweetsApp'
  getInitialState: ->
    mode: 'presentation' #oneOf(['presentation', 'dashboard'])

  componentWillMount: ->
    router = new AppRouter()
    router.on('route:initialState', @_createCallbackToChangeState('presentation'))
    router.on('route:dashboardState', @_createCallbackToChangeState('dashboard'))
    #Backbone.history.start()
    @setState router: router

  _createCallbackToChangeState: (newState) ->
    () => @setState mode: state

  _onStartNow: (e) ->
    e.preventDefault()
    @setState mode: 'dashboard'

  render: ->
    if @state.mode is 'presentation'
      GoGeoPresentation onStartNow: @_onStartNow
    else if @state.mode is 'dashboard'
      GoGeoMapView()

React.render(
  React.createElement(GoGeoTweetsApp, null),
  document.getElementById('application')
)
