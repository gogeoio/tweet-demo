var React = require('react');

var MapBoxMixin = require('./mixins/mapbox');

var div = React.DOM.div,
    h1 = React.DOM.h1,
    p = React.DOM.p,
    a = React.DOM.a;

var GoGeoPresentation = React.createClass({displayName: 'GoGeoPresentation',
    mixins: [MapBoxMixin],

    propTypes: {
        onStartNow: React.PropTypes.func.isRequired
    },

    render: function() {
        return div(null,
            div(null,
                div({className: 'jumbotron animated bounce'},
                    h1({className: 'text-center'}, 'What is going on twitter and where?'),
                    p({className: 'text-center'}, 'Wanna see more than 10 milions of geolocated tweets?'),
                    p({className: 'text-center'},
                        a({
                            className: 'btn btn-primary btn-lg',
                            href: '#', //twitter-dashboard.html
                            role: 'button',
                            onClick: this.props.onStartNow
                        }, 'Start Now')
                    )
                ),
                div({id: 'map', ref: 'map'}, null)
            ),
            div(null, '')
        );
    }
});

module.exports = GoGeoPresentation;
