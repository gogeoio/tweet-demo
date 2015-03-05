var React = require('react');

var MapBoxMixin = require('../mixins/mapbox');

var div = React.DOM.div;

var MapDashboard = React.createClass({displayName: 'GoGeoMapView.MapDashboard',
    mixins: [MapBoxMixin],

    render: function() {
        return div({id: 'map', className: 'map-dashboard'});
    }
});

module.exports = MapDashboard;
