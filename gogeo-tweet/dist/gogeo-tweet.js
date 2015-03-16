/**
 * Created by danfma on 09/03/15.
 */
///<reference path="./_references.d.ts"/>
var gogeo;
(function (gogeo) {
    var mod = angular.module("gogeo", ["ngRoute", "angularytics", "linkify"]).config([
        "$routeProvider",
        "AngularyticsProvider",
        function ($routeProvider, angularyticsProvider) {
            $routeProvider.when("/welcome", {
                controller: "WelcomeController",
                controllerAs: "welcome",
                templateUrl: "welcome/page.html"
            }).when("/dashboard", {
                controller: "DashboardController",
                controllerAs: "dashboard",
                templateUrl: "dashboard/page.html"
            }).otherwise({
                redirectTo: "/welcome"
            });
            if (window.location.hostname.match("gogeo.io")) {
                angularyticsProvider.setEventHandlers(["Google"]);
            }
            else {
                angularyticsProvider.setEventHandlers(["Console"]);
            }
        }
    ]).run(function (Angularytics) {
        Angularytics.init();
    });
    function registerController(controllerType) {
        mod.controller(controllerType.$named, controllerType);
    }
    gogeo.registerController = registerController;
    function registerService(serviceType) {
        mod.service(serviceType.$named, serviceType);
    }
    gogeo.registerService = registerService;
    function registerDirective(directiveName, config) {
        mod.directive(directiveName, config);
    }
    gogeo.registerDirective = registerDirective;
    function registerFilter(filterName, filter) {
        mod.filter(filterName, function () { return filter; });
    }
    gogeo.registerFilter = registerFilter;
})(gogeo || (gogeo = {}));
/// <reference path="../shell.ts"/>
/**
 * Created by danfma on 05/03/15.
 */
var gogeo;
(function (gogeo) {
    var DashboardController = (function () {
        function DashboardController() {
        }
        DashboardController.$named = "DashboardController";
        return DashboardController;
    })();
    gogeo.DashboardController = DashboardController;
    gogeo.registerController(DashboardController);
})(gogeo || (gogeo = {}));
/// <reference path="../shell.ts"/>
/**
 * Created by danfma on 05/03/15.
 */
var gogeo;
(function (gogeo) {
    var WelcomeController = (function () {
        function WelcomeController() {
        }
        WelcomeController.$named = "WelcomeController";
        return WelcomeController;
    })();
    gogeo.WelcomeController = WelcomeController;
    gogeo.registerController(WelcomeController);
})(gogeo || (gogeo = {}));
/**
 * Created by danfma on 07/03/15.
 */
var gogeo;
(function (gogeo) {
    function prefix(eventName) {
        return "gogeo:" + eventName;
    }
    var DashboardEvent = (function () {
        function DashboardEvent() {
        }
        DashboardEvent.mapLoaded = prefix("dashboard:mapLoaded");
        return DashboardEvent;
    })();
    gogeo.DashboardEvent = DashboardEvent;
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/**
 * Created by danfma on 07/03/15.
 */
var gogeo;
(function (gogeo) {
    var NeSwPoint = (function () {
        function NeSwPoint(ne, sw) {
            this.ne = ne;
            this.sw = sw;
        }
        return NeSwPoint;
    })();
    gogeo.NeSwPoint = NeSwPoint;
    var QueryString = (function () {
        function QueryString(field, term) {
            this.field = field;
            this.term = term;
        }
        QueryString.prototype.build = function () {
            return {
                query: {
                    query_string: {
                        query: this.term,
                        fields: [
                            this.field
                        ]
                    }
                }
            };
        };
        QueryString.HashtagText = "entities.hashtags.text";
        QueryString.UserScreenName = "user.screen_name";
        return QueryString;
    })();
    gogeo.QueryString = QueryString;
    var ThematicQuery = (function () {
        function ThematicQuery(queries, prevQuery) {
            this.queries = queries;
            this.prevQuery = prevQuery;
        }
        ThematicQuery.prototype.build = function () {
            var query = {
                query: {
                    filtered: {
                        filter: {
                            or: {
                                filters: []
                            }
                        }
                    }
                }
            };
            if (this.prevQuery) {
                query["query"]["filtered"]["query"] = this.prevQuery["query"];
            }
            for (var index in this.queries) {
                var stq = this.queries[index];
                query["query"]["filtered"]["filter"]["or"]["filters"].push(stq.build());
            }
            return query;
        };
        return ThematicQuery;
    })();
    gogeo.ThematicQuery = ThematicQuery;
    var SourceTermQuery = (function () {
        function SourceTermQuery(term) {
            this.term = term;
        }
        SourceTermQuery.prototype.build = function () {
            return {
                query: {
                    term: {
                        source: this.term
                    }
                }
            };
        };
        return SourceTermQuery;
    })();
    gogeo.SourceTermQuery = SourceTermQuery;
    var DashboardService = (function () {
        function DashboardService($q, $http, $location, angularytics) {
            this.$q = $q;
            this.$http = $http;
            this.$location = $location;
            this.angularytics = angularytics;
            this._lastGeomSpace = null;
            this._lastHashtagFilter = null;
            this._lastSearchTerm = null;
            this._loading = true;
            this._geomSpaceObservable = new Rx.BehaviorSubject(null);
            this._hashtagFilterObservable = new Rx.BehaviorSubject(null);
            this._somethingTermObservable = new Rx.BehaviorSubject(null);
            this._hashtagResultObservable = new Rx.BehaviorSubject(null);
            this._lastQueryObservable = new Rx.BehaviorSubject(null);
            this.initialize();
            if (this.$location.host().match("gogeo.io")) {
                this.angularytics.trackPageView("/");
            }
        }
        Object.defineProperty(DashboardService.prototype, "loading", {
            get: function () {
                return this._loading;
            },
            enumerable: true,
            configurable: true
        });
        DashboardService.prototype.isLoading = function () {
            return this._loading;
        };
        Object.defineProperty(DashboardService.prototype, "geomSpaceObservable", {
            get: function () {
                return this._geomSpaceObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "hashtagResultObservable", {
            get: function () {
                return this._hashtagResultObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "queryObservable", {
            get: function () {
                return this._lastQueryObservable;
            },
            enumerable: true,
            configurable: true
        });
        DashboardService.prototype.initialize = function () {
            var _this = this;
            Rx.Observable.merge(this._geomSpaceObservable, this._hashtagFilterObservable, this._somethingTermObservable).throttle(800).subscribe(function () { return _this.search(); });
        };
        DashboardService.prototype.calculateNeSW = function (bounds) {
            var ne = new L.LatLng(bounds.getNorthEast().lng, bounds.getNorthEast().lat);
            var sw = new L.LatLng(bounds.getSouthWest().lng, bounds.getSouthWest().lat);
            return new NeSwPoint(ne, sw);
        };
        DashboardService.prototype.pointToGeoJson = function (point) {
            var ne = [point.ne.lat, point.ne.lng];
            var sw = [point.sw.lat, point.sw.lng];
            var nw = [sw[0], ne[1]];
            var se = [ne[0], sw[1]];
            var coordinates = [
                [
                    sw,
                    nw,
                    ne,
                    se,
                    sw
                ]
            ];
            return {
                type: "Polygon",
                coordinates: coordinates
            };
        };
        DashboardService.prototype.updateGeomSpace = function (geom) {
            this._loading = true;
            this._lastGeomSpace = geom;
            this._geomSpaceObservable.onNext(geom);
        };
        DashboardService.prototype.updateGeomSpaceByBounds = function (bounds) {
            var point = this.calculateNeSW(bounds);
            var geomSpace = this.pointToGeoJson(point);
            this.updateGeomSpace(geomSpace);
        };
        DashboardService.prototype.updateHashtagBucket = function (bucket) {
            this._loading = true;
            this._lastHashtagFilter = bucket;
            this._hashtagFilterObservable.onNext(bucket);
        };
        DashboardService.prototype.updateSearchTerm = function (term) {
            this._loading = true;
            this._lastSearchTerm = term;
            this._somethingTermObservable.onNext(term);
        };
        DashboardService.prototype.publishMetrics = function (action, category, label) {
            if (this.$location.host().match("gogeo.io")) {
                this.angularytics.trackEvent(action, category, label);
            }
        };
        DashboardService.prototype.getTweet = function (latlng, zoom, thematicQuery) {
            return this.getTweetData(latlng, zoom, thematicQuery);
        };
        DashboardService.prototype.getTweetData = function (latlng, zoom, thematicQuery) {
            // var url = "http://172.16.2.106:9090/geosearch/db1/tweets?mapkey=123";
            var url = "http://api.gogeo.io/1.0/geosearch/db1/tweets?mapkey=123";
            var pixelDist = 2575 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8));
            var query = this.composeQuery().requestData.q;
            if (thematicQuery) {
                query = thematicQuery.build();
            }
            var data = {
                geom: {
                    type: "Point",
                    coordinates: [
                        latlng.lng,
                        latlng.lat
                    ]
                },
                limit: 1,
                buffer: pixelDist,
                buffer_measure: "degree",
                fields: [
                    "user.id",
                    "user.name",
                    "user.screen_name",
                    "user.location",
                    "user.url",
                    "user.description",
                    "user.followers_count",
                    "user.friends_count",
                    "user.listed_count",
                    "user.favourites_count",
                    "user.statuses_count",
                    "user.created_at",
                    "user.time_zone",
                    "user.geo_enabled",
                    "user.lang",
                    "user.profile_image_url",
                    "place.id",
                    "place.url",
                    "place.place_type",
                    "place.full_name",
                    "place.country_code",
                    "place.country",
                    "created_at",
                    "id",
                    "text",
                    "source",
                    "truncated",
                    "in_reply_to_status_id",
                    "in_reply_to_user_id",
                    "in_reply_to_screen_name",
                    "retweet_count",
                    "favorite_count",
                    "favorited",
                    "retweeted",
                    "possibly_sensitive",
                    "lang",
                    "timestamp_ms"
                ],
                q: angular.toJson(query) // Essa query e passada como string mesmo
            };
            return this.$http.post(url, data);
        };
        DashboardService.prototype.search = function () {
            this._loading = true;
            var query = this.composeQuery();
            var self = this;
            query.execute(function (result) {
                self._loading = false;
                self._hashtagResultObservable.onNext(result);
            });
            this._lastQueryObservable.onNext(query.requestData.q);
        };
        DashboardService.prototype.composeQuery = function () {
            var query = new DashboardQuery(this.$http, this._lastGeomSpace);
            if (this._lastHashtagFilter) {
                this.publishMetrics("click", "hashtags", this._lastHashtagFilter.key);
                query.filterByHashtag(this._lastHashtagFilter);
            }
            if (this._lastSearchTerm) {
                this.publishMetrics("search", "search", this._lastSearchTerm);
                query.filterBySearchTerm(this._lastSearchTerm);
            }
            return query;
        };
        DashboardService.$named = "dashboardService";
        DashboardService.$inject = [
            "$q",
            "$http",
            "$location",
            "Angularytics"
        ];
        return DashboardService;
    })();
    gogeo.DashboardService = DashboardService;
    var DashboardQuery = (function () {
        function DashboardQuery($http, geomSpace) {
            this.$http = $http;
            this.requestData = {};
            this.requestData = {
                agg_size: 10,
                field: "entities.hashtags.text",
                geom: geomSpace,
                q: {
                    query: {
                        filtered: {
                            filter: {}
                        }
                    }
                }
            };
        }
        DashboardQuery.prototype.filterByHashtag = function (hashtag) {
            var filter = this.requestData.q.query.filtered.filter;
            if (hashtag) {
                this.requestData["field"] = "place.full_name";
                this.requestData["agg_size"] = 5;
                var and = this.getOrCreateAndRestriction(filter);
                var queryString = new QueryString(QueryString.HashtagText, hashtag.key);
                and.filters.push(queryString.build());
            }
        };
        DashboardQuery.prototype.filterBySearchTerm = function (term) {
            var _this = this;
            var usernamePattern = /^@[a-zA-Z_]\w*\*?$/;
            Enumerable.from(term.split(' ')).select(function (entry) { return entry.trim(); }).where(function (entry) { return entry != null && entry.length > 0; }).forEach(function (entry) {
                if (usernamePattern.test(entry)) {
                    _this.filterByUsername(entry.substring(1)); // skipping the @
                }
            });
        };
        DashboardQuery.prototype.filterByUsername = function (username) {
            var filter = this.requestData.q.query.filtered.filter;
            var and = this.getOrCreateAndRestriction(filter);
            var queryString = new QueryString(QueryString.UserScreenName, username);
            and.filters.push(queryString.build());
        };
        DashboardQuery.prototype.getOrCreateAndRestriction = function (filter) {
            var and = filter["and"];
            if (!and) {
                and = filter.and = {
                    filters: []
                };
            }
            return and;
        };
        DashboardQuery.prototype.execute = function (resultHandler) {
            // var url = "http://172.16.2.106:9090/geoagg/db1/tweets?mapkey=123";
            var url = "http://api.gogeo.io/1.0/geoagg/db1/tweets?mapkey=123";
            return this.$http.post(url, this.requestData).success(resultHandler);
        };
        return DashboardQuery;
    })();
    gogeo.registerService(DashboardService);
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />
var gogeo;
(function (gogeo) {
    var DashboardDetailsController = (function () {
        function DashboardDetailsController($scope, service) {
            this.$scope = $scope;
            this.service = service;
            this.hashtagResult = null;
            this.selectedHashtag = null;
        }
        DashboardDetailsController.prototype.initialize = function () {
            var _this = this;
            this.service.hashtagResultObservable.subscribeAndApply(this.$scope, function (result) { return _this.handleResult(result); });
        };
        DashboardDetailsController.prototype.handleResult = function (result) {
            this.hashtagResult = result;
            if (this.selectedHashtag) {
                this.selectedHashtag.doc_count = result.doc_total;
            }
        };
        DashboardDetailsController.prototype.unselect = function () {
            this.selectedHashtag = null;
            this.service.updateHashtagBucket(null);
        };
        DashboardDetailsController.$inject = [
            "$scope",
            gogeo.DashboardService.$named
        ];
        return DashboardDetailsController;
    })();
    gogeo.registerDirective("dashboardDetails", function () {
        return {
            restrict: "CE",
            templateUrl: "dashboard/controls/dashboard-details-template.html",
            controller: DashboardDetailsController,
            controllerAs: "details",
            bindToController: true,
            scope: true,
            link: function (scope, element, attrs, controller) {
                controller.initialize();
            }
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />
/**
 * Created by danfma on 06/03/15.
 */
var gogeo;
(function (gogeo) {
    var DashboardHashtagsController = (function () {
        function DashboardHashtagsController($scope, service) {
            var _this = this;
            this.$scope = $scope;
            this.service = service;
            this.buckets = [];
            this.selectedHashtag = null;
            this.message = null;
            this.message = "Top 10 most used hashtags";
            this.service.hashtagResultObservable.subscribeAndApply(this.$scope, function (result) {
                if (result && result["buckets_qtd"] == 10) {
                    _this.message = "Top 10 most used hashtags";
                }
            });
        }
        DashboardHashtagsController.prototype.hasSelected = function () {
            return this.selectedHashtag != null;
        };
        DashboardHashtagsController.prototype.selectHashtag = function (bucket) {
            this.message = "Top 5 where is most used";
            this.selectedHashtag = bucket;
            this.service.updateHashtagBucket(bucket);
        };
        DashboardHashtagsController.$inject = [
            "$scope",
            gogeo.DashboardService.$named
        ];
        return DashboardHashtagsController;
    })();
    gogeo.DashboardHashtagsController = DashboardHashtagsController;
    gogeo.registerDirective("dashboardHashtags", function () {
        return {
            restrict: "E",
            templateUrl: "dashboard/controls/dashboard-hashtags-template.html",
            controller: DashboardHashtagsController,
            controllerAs: "hashtags",
            bindToController: true,
            scope: {
                buckets: "=",
                selectedHashtag: "="
            },
            link: function (scope, element, attrs, controller) {
            }
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />
var gogeo;
(function (gogeo) {
    var DashboardController = (function () {
        function DashboardController($scope, service) {
            this.$scope = $scope;
            this.service = service;
            this.initialize();
        }
        DashboardController.prototype.initialize = function () {
            var _this = this;
            this.$scope.$watch("header.term", function (term) {
                _this.service.updateSearchTerm(term);
            });
        };
        DashboardController.$inject = [
            "$scope",
            gogeo.DashboardService.$named
        ];
        return DashboardController;
    })();
    gogeo.registerDirective("dashboardHeader", function () {
        return {
            restrict: "C",
            templateUrl: "dashboard/controls/dashboard-header-template.html",
            controller: DashboardController,
            controllerAs: "header",
            bindToController: true,
            scope: true
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />
/**
 * Created by danfma on 07/03/15.
 */
var gogeo;
(function (gogeo) {
    var DashboardMapController = (function () {
        function DashboardMapController($scope, $rootScope, linkify, $sce, service) {
            this.$scope = $scope;
            this.$rootScope = $rootScope;
            this.linkify = linkify;
            this.$sce = $sce;
            this.service = service;
            this.query = { query: { filtered: { filter: {} } } };
            this.selected = "inactive";
            this.mapSelected = "thematic"; // cluster, point, intensity or thematic
            this.drawing = false;
            this.layerGroup = null;
            this.drawnItems = null;
            this.drawnGeom = null;
            this.restricted = false;
            this.canOpenPopup = true;
            this.thematicMaps = {};
            this.queries = {
                android: '<a href="http://twitter.com/download/android" rel="nofollow">Twitter for Android</a>',
                iphone: '<a href="http://twitter.com/download/iphone" rel="nofollow">Twitter for iPhone</a>',
                web: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
                instagram: '<a href="http://instagram.com" rel="nofollow">Instagram</a>',
                foursquare: '<a href="http://foursquare.com" rel="nofollow">Foursquare</a>',
                others: ''
            };
            this.layerGroup = L.layerGroup([]);
        }
        DashboardMapController.prototype.initialize = function (map) {
            var _this = this;
            this.map = map;
            this.map.addLayer(L.tileLayer('https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-4xtxp73f/{z}/{x}/{y}.png', {
                attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
            }));
            // this.map.addLayer(new L.Google('ROADMAP'));
            this.map.on("moveend", function (e) { return _this.onMapLoaded(); });
            this.map.on("click", function (e) { return _this.openPopup(e); });
            this.map.on("draw:created", function (e) { return _this.drawnHandler(e); });
            this.map.on("draw:deleted", function (e) { return _this.drawnHandler(e); });
            this.map.on("draw:edited", function (e) { return _this.drawnHandler(e); });
            this.map.on("draw:editstart", function (e) { return _this.blockPopup(); });
            this.map.on("draw:editstop", function (e) { return _this.allowPopup(); });
            this.map.on("draw:deletestart", function (e) { return _this.blockPopup(); });
            this.map.on("draw:deletestop", function (e) { return _this.allowPopup(); });
            this.initializeLayer();
            this.drawnItems = new L.FeatureGroup();
            this.map.addLayer(this.drawnItems);
            this.initializeDrawControl();
            this.service.geomSpaceObservable.subscribeAndApply(this.$scope, function (geom) { return _this.handleGeom(geom); });
        };
        DashboardMapController.prototype.initializeLayer = function () {
            var _this = this;
            this.map.addLayer(this.layerGroup);
            var layers = this.createLayers();
            for (var i in layers) {
                this.layerGroup.addLayer(layers[i]);
            }
            this.service.queryObservable.where(function (q) { return q != null; }).throttle(400).subscribeAndApply(this.$scope, function (query) { return _this.queryHandler(query); });
        };
        DashboardMapController.prototype.blockPopup = function () {
            this.canOpenPopup = false;
        };
        DashboardMapController.prototype.allowPopup = function () {
            this.canOpenPopup = true;
        };
        DashboardMapController.prototype.handleGeom = function (geom) {
        };
        DashboardMapController.prototype.initializeDrawControl = function () {
            var drawOptions = {
                draw: {
                    polyline: false,
                    polygon: false,
                    circle: false,
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
        };
        DashboardMapController.prototype.queryHandler = function (query) {
            if (JSON.stringify(query) !== JSON.stringify(this.query)) {
                this.query = query;
                this.updateLayer();
            }
            else {
            }
        };
        DashboardMapController.prototype.drawnHandler = function (event) {
            var _this = this;
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
                layer.on("click", function (e) { return _this.openPopup(e); });
            }
            else {
                this.restricted = false;
                this.drawnGeom = null;
                this.updateLayer();
                this.onMapLoaded();
            }
        };
        DashboardMapController.prototype.createLayers = function () {
            var url = this.configureUrl();
            var options = { subdomains: ["m1", "m2", "m3", "m4"] };
            if (["point", "intensity"].indexOf(this.mapSelected) != (-1)) {
                return [L.tileLayer(url, options)];
            }
            else if (this.mapSelected === "thematic") {
                return this.createThematicLayers(url, options);
            }
            else if (this.mapSelected === 'cluster') {
                return [this.createClusterLayer(url)];
            }
        };
        DashboardMapController.prototype.configureUrl = function () {
            var host = "{s}.gogeo.io/1.0";
            // var host = "172.16.2.106:9090";
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
            var url = "http://" + host + "/map/" + database + "/" + collection + "/{z}/{x}/{y}/" + serviceName + "?buffer=" + buffer + "&stylename=" + stylename + "&mapkey=123";
            if (this.query) {
                url = "" + url + "&q=" + encodeURIComponent(angular.toJson(this.query));
            }
            if (this.drawnGeom) {
                url = "" + url + "&geom=" + angular.toJson(this.drawnGeom);
            }
            return url;
        };
        DashboardMapController.prototype.createThematicLayers = function (url, options) {
            var array = [];
            var layer = null;
            // this.query = thematicQuery.build();
            // console.log("thematicQuery", JSON.stringify(thematicQuery.build(), null, 2));
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
        };
        DashboardMapController.prototype.configureThematicUrl = function (term, stylename) {
            var originalQuery = this.query;
            var sourceTermQuery = new gogeo.SourceTermQuery(this.queries[term]);
            var thematicQuery = new gogeo.ThematicQuery([sourceTermQuery], this.query);
            this.query = thematicQuery.build();
            if (term === 'others') {
                var q1 = new gogeo.QueryString("source", "*ipad*");
                var q2 = new gogeo.QueryString("source", "*windows*");
                var q3 = new gogeo.QueryString("source", "*jobs*");
                var q4 = new gogeo.QueryString("source", "*mac*");
                this.query = new gogeo.ThematicQuery([q1, q2, q3, q4]).build();
            }
            ;
            var url = this.configureUrl();
            url = url.replace("android_1", stylename);
            this.query = originalQuery;
            return url;
        };
        DashboardMapController.prototype.formatTweetText = function (text) {
            return this.$sce.trustAsHtml(this.linkify.twitter(text));
        };
        DashboardMapController.prototype.toggle = function (layer) {
            if (this.layerGroup.hasLayer(layer)) {
                this.layerGroup.removeLayer(layer);
            }
            else {
                this.layerGroup.addLayer(layer);
            }
        };
        DashboardMapController.prototype.onMapLoaded = function (geom) {
            if (this.restricted) {
                return;
            }
            if (geom) {
                this.service.updateGeomSpace(geom);
                this.restricted = true;
                this.drawnGeom = geom;
                this.updateLayer();
            }
            else {
                this.service.updateGeomSpaceByBounds(this.map.getBounds());
            }
        };
        DashboardMapController.prototype.hidePopup = function () {
            this.map.closePopup(this.popup);
            this.tweetResult = null;
        };
        DashboardMapController.prototype.formatPictureUrl = function (url) {
            if (!url) {
                return url;
            }
            var url = url.replace("_normal", "");
            return url;
        };
        DashboardMapController.prototype.formatTweetUrl = function () {
            if (this.tweetResult) {
                var url = "https://twitter.com/";
                url = url + this.tweetResult["user.screen_name"] + "/";
                url = url + "status/";
                url = url + this.tweetResult["id"];
                return url;
            }
        };
        DashboardMapController.prototype.openPopup = function (levent) {
            var _this = this;
            var zoom = this.map.getZoom();
            var intersects = true;
            if (!this.canOpenPopup) {
                return;
            }
            if (this.drawnItems.getLayers().length > 0) {
                var layer = this.drawnItems.getLayers()[0];
                var bounds = layer.getBounds();
                var point = levent.latlng;
                intersects = bounds.contains(point);
            }
            if ((this.mapSelected === "point" || this.mapSelected === "thematic") && intersects) {
                var queries = [];
                for (var index in this.thematicMaps) {
                    var thematicLayer = this.thematicMaps[index];
                    if (this.layerGroup.hasLayer(thematicLayer)) {
                        var query = new gogeo.SourceTermQuery(this.queries[index]);
                        queries.push(query);
                    }
                }
                var thematicQuery = new gogeo.ThematicQuery(queries, this.query);
                this.service.getTweet(levent.latlng, zoom, thematicQuery).success(function (result) { return _this.handlePopupResult(result, levent); });
            }
        };
        DashboardMapController.prototype.handlePopupResult = function (result, levent) {
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
            }
            else {
                this.popup.setContent($("#tweet-popup")[0]);
                this.popup.update();
            }
            this.popup.setLatLng(levent.latlng);
            this.map.openPopup(this.popup);
        };
        DashboardMapController.prototype.changeMapType = function (element) {
            this.mapSelected = element.target.id;
            this.updateLayer();
        };
        DashboardMapController.prototype.updateLayer = function () {
            this.layerGroup.clearLayers();
            var layers = this.createLayers();
            for (var i in layers) {
                this.layerGroup.addLayer(layers[i]);
            }
        };
        DashboardMapController.prototype.createClusterLayer = function (url) {
            var options = {
                subdomains: ["m1", "m2", "m3", "m4"],
                useJsonP: false,
                formatCount: function (count) {
                    return count;
                }
            };
            return new L.TileCluster(url, options);
        };
        DashboardMapController.$inject = [
            "$scope",
            "$rootScope",
            "linkify",
            "$sce",
            gogeo.DashboardService.$named
        ];
        return DashboardMapController;
    })();
    gogeo.registerDirective("dashboardMap", [
        "$timeout",
        function ($timeout) {
            return {
                restrict: "C",
                templateUrl: "dashboard/controls/dashboard-map-template.html",
                controller: DashboardMapController,
                controllerAs: "map",
                bindToController: true,
                link: function (scope, element, attrs, controller) {
                    var options = {
                        attributionControl: false,
                        minZoom: 4,
                        maxZoom: 18,
                        center: new L.LatLng(34.717232, -92.353034),
                        zoom: 6
                    };
                    var mapContainerElement = element.find(".dashboard-map-container")[0];
                    var map = L.map("map-container", options);
                    controller.initialize(map);
                    $timeout(function () { return map.invalidateSize(false); }, 1);
                    scope.$on("$destroy", function () {
                        map.remove();
                    });
                }
            };
        }
    ]);
    gogeo.registerDirective("errSrc", function () {
        return {
            link: function (scope, element, attrs) {
                element.bind("error", function () {
                    if (attrs.src != attrs.errSrc) {
                        attrs.$set("src", attrs.errSrc);
                    }
                });
            }
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
var gogeo;
(function (gogeo) {
    gogeo.registerDirective("dashboardPanel", function () {
        return {
            restrict: "C",
            link: function (scope, element, attributes) {
                function adjustSizes() {
                    var body = $(document.body);
                    var size = {
                        width: body.innerWidth(),
                        height: body.innerHeight()
                    };
                    var $top = element.find(".dashboard-top-panel");
                    var $center = element.find(".dashboard-center-panel");
                    $top.height($top.attr("data-height") + "px");
                    $center.height(size.height - $top.height());
                }
                $(window).on("resize", adjustSizes);
                adjustSizes(); // forcing the first resize
                scope.$on("destroy", function () {
                    $(window).off("resize", adjustSizes);
                });
            }
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/**
 * Created by danfma on 06/03/15.
 */
var gogeo;
(function (gogeo) {
    gogeo.registerDirective("dashboardTweetList", function () {
        return {
            restrict: "E",
            templateUrl: "dashboard/controls/dashboard-tweet-list-template.html"
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/**
 * Created by danfma on 06/03/15.
 */
var gogeo;
(function (gogeo) {
    gogeo.registerDirective("daterange", function () {
        return {
            restrict: "E",
            template: "<div class=\"input-group daterange\">\n                    <input class=\"form-control\" type=\"text\" data-provide=\"datepicker\" data-date-clear-btn=\"true\"/>\n                    <span class=\"input-group-addon\">\n                        <i class=\"glyphicon glyphicon-calendar\"></i>\n                    </span>\n                    <input class=\"form-control\" type=\"text\" data-provide=\"datepicker\" data-date-clear-btn=\"true\"/>\n                 </div>",
            link: function (scope, element, attrs) {
            }
        };
    });
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/**
 * Created by danfma on 05/03/15.
 */
var gogeo;
(function (gogeo) {
    angular.module("gogeo").directive("welcomeMap", [
        function () {
            return {
                restrict: "C",
                // template: "<div></div>",
                link: function (scope, element, attrs) {
                    var rawElement = element[0];
                    var url = "http://api.gogeo.io/1.0/map/db1/tweets/{z}/{x}/{y}/tile.png?mapkey=123&style_name=gogeo_many_points";
                    // var url = "http://172.16.2.106:9090/map/db1/tweets/{z}/{x}/{y}/tile.png?mapkey=123&stylename=gogeo_many_points";
                    var initialPos = L.latLng(43.717232, -92.353034);
                    var map = L.map("welcome-map").setView(initialPos, 5);
                    // map.addLayer(new L.Google('ROADMAP'));
                    map.addLayer(L.tileLayer('https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-4xtxp73f/{z}/{x}/{y}.png', {
                        attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
                    }));
                    L.tileLayer(url).addTo(map);
                    scope.$on("destroy", function () { return map.remove(); });
                }
            };
        }
    ]);
})(gogeo || (gogeo = {}));
