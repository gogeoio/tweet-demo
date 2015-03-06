React = require('react')
{div, h1, p, a} = React.DOM

MapBoxMixin = require('./mixins/mapbox.coffee')

GoGeoPresentation = React.createClass
  displayName: 'GoGeoPresentation'
  mixins: [MapBoxMixin]

  propTypes:
    onStartNow: React.PropTypes.func.isRequired

  render: ->
    div null,
      div null,
        div {className: 'jumbotron animated bounce'},
          h1 {className: 'text-center'}, 'What is going on twitter and where?'
          p {className: 'text-center'}, 'Wanna see more than 10 milions of geolocated tweets?'
          p {className: 'text-center'},
            a {className: 'btn btn-primary btn-lg', href: '#', role: 'button', onClick: this.props.onStartNow},
              'Start Now'
        div {id: 'map', ref: 'mapEl'}, null
      div null, ''

module.exports = GoGeoPresentation;
