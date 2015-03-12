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
        tweetResult: ITweet;
        popup: L.Popup;
        query: any = { query: { filtered: { filter: { } } } };
        selected: string = "inactive";
        mapSelected: string = "point";
        drawing: boolean = false;
        layerGroup: L.LayerGroup<L.ILayer> = null;

        constructor(private $scope:ng.IScope,
                    private $rootScope:ng.IScope,
                    private service:DashboardService) {
            this.layerGroup = L.layerGroup([]);
        }

        initialize(map: L.Map) {
            this.map = map;
            this.map.addLayer(new L.Google('ROADMAP'));
            this.map.on("moveend", (e) => this.onMapLoaded());
            this.map.on("click", (e) => this.openPopup(e));

            this.initializeLayer();
        }

        initializeLayer() {

            this.map.setView(new L.LatLng(34.717232, -92.353034), 5);
            this.map.addLayer(this.layerGroup);

            var layer = this.createLayer();
            this.layerGroup.addLayer(layer);

            this.service.queryObservable
                .where(q => q != null)
                .throttle(400)
                .subscribeAndApply(this.$scope, (query) => this.queryHandler(query));
        }

        private queryHandler(query: any) {
            if (JSON.stringify(query) !== JSON.stringify(this.query)) {
                this.query = query;
                this.updateLayer();
            } else {
                // same query, don't update the map
            }
        }

        private createLayer(query?: string): L.ILayer {
            var url = this.configureUrl(query);

            if (['point', 'thematic', 'intensity'].indexOf(this.mapSelected) != (-1)) {
                return L.tileLayer(url, {
                    subdomains: ["m1", "m2", "m3", "m4"]
                });
            } else if (this.mapSelected === 'cluster') {
                return this.createClusterLayer(url);
            }
        }

        private configureUrl(query?: string): string {
            var host = "{s}.gogeo.io/1.0";
            // host = "172.16.2.106:9090";
            var database = "db1";
            var collection = "tweets";
            var buffer = 8;
            var stylename = "gogeo_many_points";
            var serviceName = "tile.png";

            if (this.mapSelected === "cluster") {
                serviceName = "cluster.json";
            }

            if (this.mapSelected === "thematic") {
                stylename = "gogeo_heatmap";
            }

            var url = "http://" + host + "/map/"
                + database + "/" +
                collection + "/{z}/{x}/{y}/"
                + serviceName + "?buffer=" + buffer +
                "&stylename=" + stylename + "&mapkey=123";

            if (query) {
                url = `${url}&q=${angular.toJson(query)}`
            }

            console.log('url', url);

            return url;
        }

        drawArea() {
            this.drawing = true;
        }

        onMapLoaded() {
            this.service.updateGeomSpaceByBounds(this.map.getBounds());
        }

        hidePopup() {
            this.map.closePopup(this.popup);
            this.tweetResult = null;
        }

        formatPictureUrl(url: string) {
            if (!url) {
                return url;
            }

            var url = url.replace("_normal", "");
            return url;
        }

        formatTweetUrl() {
            if (this.tweetResult) {
                var url = "https://twitter.com/";
                url = url + this.tweetResult["user.screen_name"] + "/";
                url = url + "status/";
                url = url + this.tweetResult["id"];

                return url;
            }
        }

        openPopup(levent: any) {
            var self = this;
            var zoom = this.map.getZoom();

            if (this.mapSelected === "point") {
                this.service.getTweet(levent.latlng, zoom).success(
                    function(result: ITweet) {
                        self.tweetResult = result[0];

                        if (!self.tweetResult) {
                            return;
                        }

                        if (self.popup == null) {
                            var options = {
                                closeButton: false,
                                className: "marker-popup",
                                offset: new L.Point(-195, -265)
                            };
                            self.popup = L.popup(options);
                            self.popup.setContent($("#tweet-popup")[0]);
                        } else {
                            self.popup.setContent($("#tweet-popup")[0]);
                            self.popup.update();
                        }

                        self.popup.setLatLng(levent.latlng);
                        self.map.openPopup(self.popup);
                    }
                );
            }
        }

        changeMapView(element: any) {
            this.mapSelected = element.target.id;
            this.updateLayer();
        }

        private updateLayer() {
            this.layerGroup.clearLayers();
            var layer = this.createLayer(this.query);
            this.layerGroup.addLayer(layer);
        }

        private createClusterLayer(url): L.ILayer {
            var options = {
                subdomains: [ "m1", "m2", "m3", "m4" ],
                useJsonP: false,
                formatCount: function(count) {
                    return count;
                }
            };

            return new L.TileCluster(url, options);
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
                        minZoom: 4,
                        maxZoom: 18,
                        center: new L.LatLng(51.51, -0.11),
                        zoom: 12
                    };

                    var mapContainerElement = element.find(".dashboard-map-container")[0];
                    var map = L.map("map-container", options);

                    controller.initialize(map);
                    $timeout(() => map.invalidateSize(false), 1);

                    scope.$on("$destroy", () => {
                        map.remove();
                    });
                }
            };
        }
    ]);

    registerDirective("errSrc", function() {
        return {
            link: function(scope, element, attrs) {
                element.bind("error", function() {
                    if (attrs.src != attrs.errSrc) {
                        attrs.$set("src", attrs.errSrc);
                    }
                });
            }
        }
    });
}
