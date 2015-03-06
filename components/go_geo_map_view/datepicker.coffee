React = require('react')
{div, input, i, span} = React.DOM

DatePicker = React.createClass
  displayName: 'GoGeoMapView.DatePicker'

  componentDidMount: ->
    jQuery(@refs.inputDaterange.getDOMNode())
      .datepicker
        clearBtn: true
        multidate: true
        todayHighlight: true

  render: ->
    div {className: 'input-daterange input-group', id: 'datepicker', ref: 'inputDaterange'},
      input
        type: 'text'
        className: 'input-sm form-control'
        name: 'start'
        placeholder: '12/05/2014'
      span {className: 'input-group-addon'}, i {className: 'fa fa-calendar fa-2x'}
      input
        type: 'text'
        className: 'input-sm form-control'
        name: 'end'
        placeholder: '02/25/2015'

module.exports = DatePicker
