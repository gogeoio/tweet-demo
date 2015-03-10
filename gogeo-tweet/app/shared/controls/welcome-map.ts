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
                    template: "<div>Testando!</div>",
                    link: (scope, element, attrs) => {
                        var rawElement = element[0];
                        var accessToken = "pk.eyJ1IjoibG9raWRnIiwiYSI6IkRfNkpoMHcifQ.m4reSWIhrD5xIJVkrhRAxA";

                        L.mapbox.accessToken = accessToken;

                        var initialPos = L.latLng(-11.372, -57.634);
                        var map = L.mapbox.map(rawElement, "lokidg.i7gg619k").setView(initialPos, 5);

                        scope.$on("destroy", () => map.remove());
                    }
                };
            }
        ]);

}