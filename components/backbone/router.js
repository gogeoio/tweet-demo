var Backbone = require('backbone');

var Router = Backbone.Router.extend({
    routes: {
        '': 'initialState',
        'dashboard': 'dashboardState'
    }
});

module.exports = Router;
