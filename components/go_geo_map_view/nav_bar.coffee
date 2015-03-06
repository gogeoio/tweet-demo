React = require('react')
{div, nav, button, span, a, i, img, ul, li} = React.DOM

DatePicker = require('./datepicker.coffee')
Filter = require('./filter.coffee')

NavBar = React.createClass
  displayName: 'GoGeoMapView.NavBar'

  render: ->
    nav {className: 'animate fadeIn navbar-static-top navbar navbar-default'},
      div {className: 'container-fluid'},
        div {className: 'navbar-header'},
          button {type: 'button', className: 'navbar-toggle collapsed', 'data-toggle': 'collapse', 'data-target': '#header-navbar-collapse'},
            span {className: 'sr-only'}, 'Toggle navigation'
            span {className: 'icon-bar'}
            span {className: 'icon-bar'}
            span {className: 'icon-bar'}
          a {className: 'navbar-brand', href: '#'}, img {alt: 'Brand', src: 'assets/img/gogeo-logo.png'}
        div {className: 'collapse navbar-collapse', id: 'header-navbar-collapse'},
          ul {className: 'nav navbar-nav navbar-left'},
            li null, Filter()
            li {id: 'rangedate'}, DatePicker()
            li null,
              button {className: 'btn btn-tour', type: 'button'},
                i {className: 'fa fa-2x fa-bullhorn'}
                span null, 'tour'
          ul {className: 'nav navbar-nav navbar-right'},
            li {className: 'pull-right'},
              button {className: 'btn btn-warning btn-block btn-lg', type: 'button', 'data-toggle': 'modal', 'data-target': '#addMoreTweets'},
                'Add more milions of tweets'

module.exports = NavBar
