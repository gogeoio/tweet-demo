/// <reference path="../../shell.ts" />

/**
 * Created by danfma on 05/03/15.
 */


module gogeo {

    angular.module("gogeo")
        .directive("welcomeMap", [
            () => {
                return {
                    restrict: "C",
                    // template: "<div></div>",
                    link: (scope, element, attrs) => {
                        var rawElement = element[0];
                        var url = "http://api.gogeo.io/1.0/map/db1/tweets/{z}/{x}/{y}/tile.png?mapkey=123&stylename=gogeo_many_points";
                        var initialPos = L.latLng(43.717232, -92.353034);
                        var map = L.map("welcome-map").setView(initialPos, 5);

                        map.addLayer(L.tileLayer('https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-4xtxp73f/{z}/{x}/{y}.png', {
                          attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
                        }));

                        L.tileLayer(url).addTo(map);

                        scope.$on("destroy", () => map.remove());
                    }
                };
            }
        ]);

}