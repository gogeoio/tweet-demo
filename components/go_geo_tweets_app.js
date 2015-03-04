var React = require('react');
var GoGeoMaps = require('./go_geo_maps.js');

var GoGeoTweetsApp = React.createClass({displayName: 'GoGeoTweetsApp',

    getInitialState: function() {
        return ({
            mode: 'presentation'
        })
    },

    componentDidMount: function() {
        L.mapbox.accessToken = 'pk.eyJ1IjoibG9raWRnIiwiYSI6IkRfNkpoMHcifQ.m4reSWIhrD5xIJVkrhRAxA';
        var map = L.mapbox.map('map', 'lokidg.i7gg619k').setView([-11.372, -57.634], 5);
    },

    render: function() {
        if (this.state.mode === 'presentation') {
            return React.DOM.div(null,
                React.DOM.div(null,
                    React.DOM.div({className: 'jumbotron animated bounce'},
                        React.DOM.h1({className: 'text-center'}, 'What is going on twitter and where?'),
                        React.DOM.p({className: 'text-center'}, 'Wanna see more than 10 milions of geolocated tweets?'),
                        React.DOM.p({className: 'text-center'},
                            React.DOM.a({className: 'btn btn-primary btn-lg', href: 'twitter-dashboard.html', role: 'button'},
                                'Start Now')
                        )
                    ),
                    React.DOM.div({id: 'map', ref: 'map'}, null)
                ),
                React.DOM.div(null, ''),
                GoGeoMaps({})
            );
        }
  }
});

React.render(
    React.createElement(GoGeoTweetsApp, null),
    document.getElementById('application')
);
