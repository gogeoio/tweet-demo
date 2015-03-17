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
            "linkify",
            "$sce",
            DashboardService.$named
        ];

        map: L.Map;
        tweetResult: ITweet;
        popup: L.Popup;
        query: any = { query: { filtered: { filter: { } } } };
        selected: string = "inactive";
        mapSelected: string = "thematic"; // cluster, point, intensity or thematic
        drawing: boolean = false;
        layerGroup: L.LayerGroup<L.ILayer> = null;
        drawnItems: L.FeatureGroup<L.ILayer> = null;
        drawnGeom: IGeomSpace = null;
        restricted: boolean = false;
        canOpenPopup: boolean = true;
        thematicMaps: any = {};
        queries: any = {
            android: '<a href="http://twitter.com/download/android" rel="nofollow">Twitter for Android</a>',
            iphone: '<a href="http://twitter.com/download/iphone" rel="nofollow">Twitter for iPhone</a>',
            web: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
            instagram: '<a href="http://instagram.com" rel="nofollow">Instagram</a>',
            foursquare: '<a href="http://foursquare.com" rel="nofollow">Foursquare</a>',
            others: ''
        }

        constructor(private $scope:ng.IScope,
                    private $rootScope:ng.IScope,
                    private linkify: any,
                    private $sce: ng.ISCEService,
                    private service:DashboardService) {
            this.layerGroup = L.layerGroup([]);
        }

        initialize(map: L.Map) {
            this.map = map;

            this.map.addLayer(L.tileLayer('https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-4xtxp73f/{z}/{x}/{y}.png', {
              attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
            }));

            // this.map.addLayer(new L.Google('ROADMAP'));
            this.map.on("moveend", (e) => this.onMapLoaded());
            this.map.on("click", (e) => this.openPopup(e));
            this.map.on("draw:created", (e) => this.drawnHandler(e));
            this.map.on("draw:deleted", (e) => this.drawnHandler(e));
            this.map.on("draw:edited", (e) => this.drawnHandler(e));
            this.map.on("draw:editstart", (e) => this.blockPopup());
            this.map.on("draw:editstop", (e) => this.allowPopup());
            this.map.on("draw:deletestart", (e) => this.blockPopup());
            this.map.on("draw:deletestop", (e) => this.allowPopup());

            this.initializeLayer();
            this.drawnItems = new L.FeatureGroup();
            this.map.addLayer(this.drawnItems);
            this.initializeDrawControl();

            this.service.geomSpaceObservable
                .subscribeAndApply(this.$scope, geom => this.handleGeom(geom));
        }

        initializeLayer() {
            this.map.addLayer(this.layerGroup);

            var layers = this.createLayers();
            for (var i in layers) {
                this.layerGroup.addLayer(layers[i]);
            }

            this.service.queryObservable
                .where(q => q != null)
                .throttle(400)
                .subscribeAndApply(this.$scope, (query) => this.queryHandler(query));
        }

        private blockPopup() {
            this.canOpenPopup = false;
        }

        private allowPopup() {
            this.canOpenPopup = true;
        }

        private handleGeom(geom: IGeomSpace) {

        }

        private initializeDrawControl() {
            var drawOptions = {
                draw: {
                    polyline: false,
                    polygon: false,
                    circle: false, // Turns off this drawing tool
                    marker: false,
                    rectangle: {
                      showArea: true,
                      shapeOptions: {
                        color: "yellow"
                      }
                    }
                },
                edit: {
                    featureGroup: this.drawnItems
                },
                trash: true
            };

            var drawControl = new L.Control.Draw(drawOptions);
            this.map.addControl(drawControl);
        }

        private queryHandler(query: any) {
            if (JSON.stringify(query) !== JSON.stringify(this.query)) {
                this.query = query;
                this.updateLayer();
            } else {
                // same query, don't update the map
            }
        }

        private drawnHandler(event: any) {
            var layerType = event["layerType"];
            var eventType = event["type"];
            var layer = event["layer"];

            if (!layer) {
                layer = this.drawnItems.getLayers()[0];
            }

            this.drawnItems.clearLayers();

            if (layer) {
                this.restricted = false;
                var geojson = layer.toGeoJSON();
                this.drawnItems.addLayer(layer);
                this.onMapLoaded(geojson["geometry"]);

                layer.on("click", (e) => this.openPopup(e))
            } else {
                this.restricted = false;
                this.drawnGeom = null;
                this.updateLayer();
                this.onMapLoaded();
            }
        }

        private createLayers(): Array<L.ILayer> {
            var url = this.configureUrl();
            var options = { subdomains: ["m1", "m2", "m3", "m4"] };

            if (["point", "intensity"].indexOf(this.mapSelected) != (-1)) {
                return [L.tileLayer(url, options)];
            } else if (this.mapSelected === "thematic") {
                return this.createThematicLayers(url, options);
            } else if (this.mapSelected === 'cluster') {
                return [this.createClusterLayer(url)];
            }
        }

        private configureUrl(): string {
            var database = "db1";
            var collection = "tweets";
            var buffer = 8;
            var stylename = "gogeo_many_points";
            var serviceName = "tile.png";

            if (this.mapSelected === "cluster") {
                serviceName = "cluster.json";
            }

            if (this.mapSelected === "thematic") {
                stylename = "android_1";
            }

            if (this.mapSelected === "intensity") {
                stylename = "gogeo_intensity";
            }

            var url = "/map/"
                + database + "/" +
                collection + "/{z}/{x}/{y}/"
                + serviceName + "?buffer=" + buffer +
                "&stylename=" + stylename + "&mapkey=123";

            if (this.query) {
                url = `${url}&q=${encodeURIComponent(angular.toJson(this.query))}`;
            }

            if (this.drawnGeom) {
                url = `${url}&geom=${angular.toJson(this.drawnGeom)}`;
            }

            return Configuration.makeUrl(url);
        }

        private createThematicLayers(url: string, options: any) {
            var array = [];
            var layer = null;

            url = this.configureThematicUrl("iphone", "iphone_1");
            layer = L.tileLayer(url, options);
            this.thematicMaps["iphone"] = layer;
            array.push(layer);

            url = this.configureThematicUrl("android", "android_1");
            layer = L.tileLayer(url, options);
            this.thematicMaps["android"] = layer;
            array.push(layer);

            url = this.configureThematicUrl("others", "others_1");
            layer = L.tileLayer(url, options);
            this.thematicMaps["others"] = layer;
            array.push(layer);

            url = this.configureThematicUrl("web", "web_1");
            layer = L.tileLayer(url, options);
            this.thematicMaps["web"] = layer;
            array.push(layer);

            url = this.configureThematicUrl("instagram", "instagram_1");
            layer = L.tileLayer(url, options);
            this.thematicMaps["instagram"] = layer;
            array.push(layer);

            url = this.configureThematicUrl("foursquare", "foursquare_1");
            layer = L.tileLayer(url, options);
            this.thematicMaps["foursquare"] = layer;
            array.push(layer);

            return array;
        }

        private configureThematicUrl(term: string, stylename: string): string {
            var originalQuery = this.query;

            if (term === 'others') {
                var thematicQuery = this.createThematicOthersQuery(this.query);
                this.query = thematicQuery.build();
            } else {
                var sourceTermQuery = new SourceTermQuery(this.queries[term]);
                var thematicQuery = new ThematicQuery([sourceTermQuery], this.query);
                this.query = thematicQuery.build();
            };

            var url = this.configureUrl();
            url = url.replace("android_1", stylename);

            this.query = originalQuery;

            return url;
        }

        private createThematicOthersQuery(query?: TextQueryBuilder): ThematicQuery {
            var q1 = new TextQueryBuilder("source", "*ipad*");
            var q2 = new TextQueryBuilder("source", "*windows*");
            var q3 = new TextQueryBuilder("source", "*jobs*");
            var q4 = new TextQueryBuilder("source", "*mac*");

            var tq = null;

            if (query) {
                tq = new ThematicQuery([ q1, q2, q3, q4 ], query);
            } else {
                tq = new ThematicQuery([ q1, q2, q3, q4 ]);
            }

            return tq;
        }

        formatTweetText(text: string) {
            return this.$sce.trustAsHtml(this.linkify.twitter(text));
        }

        formatDate(dateString: string) {
            var date = new Date(dateString);
            return moment(date).utc().format("LLLL");
        }

        toggle(layer: L.ILayer) {
            if (this.layerGroup.hasLayer(layer)) {
                this.layerGroup.removeLayer(layer);
            } else {
                this.layerGroup.addLayer(layer);
            }
        }

        onMapLoaded(geom?: IGeomSpace) {
            if (this.restricted) {
                return;
            }

            if (geom) {
                this.service.updateGeomSpace(geom);
                this.restricted = true;
                this.drawnGeom = geom;
                this.updateLayer();
            } else {
                this.service.updateGeomSpaceByBounds(this.map.getBounds());
            }
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
            var zoom = this.map.getZoom();

            var intersects = true;

            if (!this.canOpenPopup) {
                return;
            }

            if (this.drawnItems.getLayers().length > 0) {
                var layer = <L.Polygon>this.drawnItems.getLayers()[0];
                var bounds = layer.getBounds();
                var point = levent.latlng;
                intersects = bounds.contains(point);
            }

            if ((this.mapSelected === "point" || this.mapSelected === "thematic" ) && intersects) {
                var queries = [];

                for (var index in this.thematicMaps) {
                    var thematicLayer = this.thematicMaps[index];

                    if (this.layerGroup.hasLayer(thematicLayer)) {
                        var query = null;

                        if (index === 'others') {
                            query = this.createThematicOthersQuery().build();

                            // var q1 = new TextQueryBuilder("source", "*ipad*");
                            // var q2 = new TextQueryBuilder("source", "*windows*");
                            // var q3 = new TextQueryBuilder("source", "*jobs*");
                            // var q4 = new TextQueryBuilder("source", "*mac*");
                            // query = new ThematicQuery([ q1, q2, q3, q4 ]).build();
                        } else {
                            query = new SourceTermQuery(this.queries[index]);
                        }

                        queries.push(query);
                    }
                }

                var thematicQuery = new ThematicQuery(queries, this.query);
                this.service.getTweet(levent.latlng, zoom, thematicQuery)
                    .success(result => this.handlePopupResult(result, levent));
            }
        }

        private handlePopupResult(result: ITweet, levent: any) {
            this.tweetResult = result[0];

            if (!this.tweetResult) {
                return;
            }

            if (this.popup == null) {
                var options = {
                    closeButton: false,
                    className: "marker-popup",
                    offset: new L.Point(-200, -272)
                };
                this.popup = L.popup(options);
                this.popup.setContent($("#tweet-popup")[0]);
            } else {
                this.popup.setContent($("#tweet-popup")[0]);
                this.popup.update();
            }

            this.popup.setLatLng(levent.latlng);
            this.map.openPopup(this.popup);
                    
        }

        changeMapType(element: any) {
            this.mapSelected = element.target.id;
            this.updateLayer();
        }

        private updateLayer() {
            this.layerGroup.clearLayers();
            var layers = this.createLayers();

            for (var i in layers) {
                this.layerGroup.addLayer(layers[i]);
            }
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
                        center: new L.LatLng(34.717232, -92.353034),
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