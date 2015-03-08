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

        map:L.Map;
        tweetResult:ITweet;

        constructor(private $scope:ng.IScope,
                    private $rootScope:ng.IScope,
                    private service:DashboardService) {

        }

        initialize(map: L.Map) {
            this.map = map;
            this.map.addLayer(new L.Google('ROADMAP'));
            this.map.on("moveend", (e) => this.onMapLoaded());
            this.map.on("click", (e) => this.openPopup(e));
            // this.map.on("click", (e) => this.service.getTweet(e['latlng']));

            this.initializeLayer();
        }

        initializeLayer() {
            var host = '{s}.gogeo.io/1.0';
            var database = 'db1';
            var collection = 'tweets';
            var buffer = 32;
            var stylename = 'gogeo_many_points';

            var url = 'http://' + host + '/map/' + database + '/' +
                collection + '/{z}/{x}/{y}/tile.png?buffer=' + buffer +
                '&stylename=' + stylename + '&mapkey=123';

            var layer = L.tileLayer(url, {
                subdomains: ["m1", "m2", "m3", "m4"]
            });

            var layerGroup = L.layerGroup([]);

            this.map.setView(new L.LatLng(34.717232, -92.353034), 5);
            this.map.addLayer(layerGroup);

            layerGroup.addLayer(layer);

            this.service.queryObservable
                .where(q => q != null)
                .throttle(400)
                .subscribeAndApply(this.$scope, (query) => {
                    var newUrl = `${url}&q=${angular.toJson(query)}`;

                    layerGroup.removeLayer(layer);

                    layer = L.tileLayer(newUrl, {
                        subdomains: ["m1", "m2", "m3", "m4"]
                    });

                    layerGroup.addLayer(layer);
                });
        }

        onMapLoaded() {
            this.service.updateGeomSpaceByBounds(this.map.getBounds());
        }

        openPopup(event) {
            var self = this;
            this.service.getTweet(event.latlng).success(
                function(result: ITweet) {
                    self.tweetResult = result[0];

                    var popup = L.popup();
                    popup.setContent($("#tweet-popup")[0]);
                    popup.setLatLng(event.latlng);
                    self.map.openPopup(popup);
                }
            );
        }
    }

    registerDirective("dashboardMap", [
        "$timeout",
        ($timeout:ng.ITimeoutService) => {
            return {
                restrict: "C",
                templateUrl: "dashboard/controls/dashboard-map-template.html",
                controller: DashboardMapController,
                controllerAs: "map",
                bindToController: true,

                link(scope, element, attrs, controller:DashboardMapController) {
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
