var React = require('react');

var NavBar = require('./go_geo_map_view/nav_bar'),
    MapDashboard = require('./go_geo_map_view/map_dashboard');

var div = React.DOM.div;

var GoGeoMapView = React.createClass({displayName: 'GoGeoMapView',
    render: function() {
        return div({className: 'go-geo-container'},
            NavBar(),
            MapDashboard()
        );
    }
});

module.exports = GoGeoMapView;
