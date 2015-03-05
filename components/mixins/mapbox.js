var MapBox = {
    componentDidMount: function() {
        L.mapbox.accessToken = 'pk.eyJ1IjoibG9raWRnIiwiYSI6IkRfNkpoMHcifQ.m4reSWIhrD5xIJVkrhRAxA';
        var map = L.mapbox.map('map', 'lokidg.i7gg619k').setView([-11.372, -57.634], 5);
    }
};

module.exports = MapBox;
