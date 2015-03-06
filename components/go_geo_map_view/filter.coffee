React = require('react')
{div, form, input, label} = React.DOM

Filter = React.createClass
  displayName: 'GoGeoMapView.Filter'

  render: ->
    form {className: 'form-inline', rule: 'search'},
      div {className: 'form-group'},
        label {className: 'sr-only', htmlFor: 'lookingForSomething'}, 'Hashtag and user search'
        input
          type: 'text',
          className: 'form-control',
          id: 'lookingForSomething',
          placeholder: 'Looking for something?'
      div {className: 'form-group space-h1'},
        label {className: 'sr-only', htmlFor: 'lookingWhere'}, 'Where? Contry only'
        input
          type: 'text'
          className: 'form-control'
          id: 'lookingWhere'
          placeholder: 'Where? Contry only.'

module.exports = Filter
