var React = require('react'),
    Backbone = require('backbone');

var AppRouter = require('./backbone/router'),
    GoGeoMapView = require('./go_geo_map_view.js'),
    GoGeoPresentation = require('./go_geo_presentation.js');

var div = React.DOM.div;

var GoGeoTweetsApp = React.createClass({displayName: 'GoGeoTweetsApp',
    getInitialState: function() {
        return ({
            mode: 'presentation' //oneOf(['presentation', 'dashboard'])
        })
    },

    componentWillMount: function() {
        router = new AppRouter()
        router.on('route:initialState', this._createCallbackToChangeState('presentation'));
        router.on('route:dashboardState', this._createCallbackToChangeState('dashboard'));
        //Backbone.history.start();
        this.setState({router: router});
    },

    _createCallbackToChangeState: function(newState) {
        var component = this,
            state = newState;

        return function() {
            component.setState({mode: state});
        };
    },

    _onStartNow: function(e) {
        e.preventDefault();
        this.setState({mode: 'dashboard'});
    },

    render: function() {
        if (this.state.mode === 'presentation') {
            return GoGeoPresentation({onStartNow: this._onStartNow});
        } else if (this.state.mode === 'dashboard') {
            return GoGeoMapView();
        }
    }
});

React.render(
    React.createElement(GoGeoTweetsApp, null),
    document.getElementById('application')
);
