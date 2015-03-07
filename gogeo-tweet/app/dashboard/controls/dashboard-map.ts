/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />

/**
 * Created by danfma on 07/03/15.
 */



module gogeo {


    class DashboardMapController {
        static $inject = [
            "$scope",
            "$rootScope",
            DashboardService.$named
        ];

        map: L.Map;

        constructor(
            private $scope: ng.IScope,
            private $rootScope: ng.IScope,
            private service: DashboardService) {

        }

        initialize(map: L.Map) {
            this.map = map;
            this.map.addLayer(new L.Google('ROADMAP'));
            this.map.on("moveend", (e) => this.onMapLoaded());
        }

        onMapLoaded() {
            console.log("onMapLoaded");
            this.service.updateGeomSpaceByBounds(this.map.getBounds());
        }
    }

    registerDirective("dashboardMap", [
        "$timeout",
        ($timeout: ng.ITimeoutService) => {
            return {
                restrict: "C",
                template: "<div class='dashboard-map-container'></div>",
                controller: DashboardMapController,
                bindToController: true,

                link(scope, element, attrs, controller: DashboardMapController) {
                    var options = {
                        attributionControl: false,
                        minZoom: 2,
                        maxZoom: 18,
                        center: new L.LatLng(51.51, -0.11),
                        zoom: 12
                    };

                    var mapContainerElement = element.find(".dashboard-map-container")[0];
                    var map = L.map(mapContainerElement, options);

                    controller.initialize(map);
                    $timeout(() => map.invalidateSize(false), 1);

                    scope.$on("$destroy", () => {
                        map.remove();
                    });
                }
            };
        }
    ]);

}
