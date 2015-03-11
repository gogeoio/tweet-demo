/**
 * Created by danfma on 09/03/15.
 */
///<reference path="./_references.d.ts"/>
var gogeo;
(function (gogeo) {
    var mod = angular.module("gogeo", ["ngRoute", "angularytics"]).config([
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
            this._lastGeomSpace = geom;
            this._geomSpaceObservable.onNext(geom);
        };
        DashboardService.prototype.updateGeomSpaceByBounds = function (bounds) {
            this._loading = true;
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
        DashboardService.prototype.getTweet = function (latlng) {
            return this.getTweetData(latlng);
        };
        DashboardService.prototype.getTweetData = function (latlng) {
            var url = "http://api.gogeo.io/1.0/geosearch/db1/tweets?mapkey=123";
            var zoom = 5;
            var pixelDist = 40075 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8));
            var query = this.composeQuery().requestData;
            var data = {
                geom: {
                    type: "Point",
                    coordinates: [
                        latlng.lng,
                        latlng.lat
                    ]
                },
                limit: 1,
                buffer: pixelDist * 16,
                buffer_measure: "kilometer",
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
                q: angular.toJson(query.q) // Essa query e passada como string mesmo
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
                this.requestData["field"] = "place.full_name.raw";
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
            this.$scope = $scope;
            this.service = service;
            this.buckets = [];
            this.selectedHashtag = null;
            this.message = null;
            this.message = "Top 10 most used hashtags";
        }
        DashboardHashtagsController.prototype.hasSelected = function () {
            return this.selectedHashtag != null;
        };
        DashboardHashtagsController.prototype.selectHashtag = function (bucket) {
            this.message = "Top 5 where is most used";
            this.selectedHashtag = bucket;
            this.service.updateHashtagBucket(bucket);
        };
        DashboardHashtagsController.prototype.unselect = function () {
            this.message = "Top 10 most used hashtags";
            this.selectedHashtag = null;
            this.service.updateHashtagBucket(null);
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
        function DashboardMapController($scope, $rootScope, service) {
            this.$scope = $scope;
            this.$rootScope = $rootScope;
            this.service = service;
            this.query = { query: { filtered: { filter: {} } } };
        }
        DashboardMapController.prototype.initialize = function (map) {
            var _this = this;
            this.map = map;
            this.map.addLayer(new L.Google('ROADMAP'));
            this.map.on("moveend", function (e) { return _this.onMapLoaded(); });
            this.map.on("click", function (e) { return _this.openPopup(e); });
            this.initializeLayer();
        };
        DashboardMapController.prototype.initializeLayer = function () {
            var host = '{s}.gogeo.io/1.0';
            var database = 'db1';
            var collection = 'tweets';
            var buffer = 32;
            var stylename = 'gogeo_many_points';
            var url = 'http://' + host + '/map/' + database + '/' + collection + '/{z}/{x}/{y}/tile.png?buffer=' + buffer + '&stylename=' + stylename + '&mapkey=123';
            var layer = L.tileLayer(url, {
                subdomains: ["m1", "m2", "m3", "m4"]
            });
            var layerGroup = L.layerGroup([]);
            this.map.setView(new L.LatLng(34.717232, -92.353034), 5);
            this.map.addLayer(layerGroup);
            layerGroup.addLayer(layer);
            var self = this;
            this.service.queryObservable.where(function (q) { return q != null; }).throttle(400).subscribeAndApply(this.$scope, function (query) {
                var newUrl = "" + url + "&q=" + angular.toJson(query);
                var filter = JSON.stringify(query["query"]["filtered"]["filter"]);
                if (JSON.stringify(query) !== JSON.stringify(self.query)) {
                    self.query = query;
                    layerGroup.removeLayer(layer);
                    layer = L.tileLayer(newUrl, {
                        subdomains: ["m1", "m2", "m3", "m4"]
                    });
                    layerGroup.addLayer(layer);
                }
                else {
                }
            });
        };
        DashboardMapController.prototype.onMapLoaded = function () {
            this.service.updateGeomSpaceByBounds(this.map.getBounds());
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
        DashboardMapController.prototype.openPopup = function (event) {
            var self = this;
            this.service.getTweet(event.latlng).success(function (result) {
                self.tweetResult = result[0];
                if (self.popup == null) {
                    var options = {
                        closeButton: false,
                        className: "marker-popup",
                        offset: new L.Point(-195, -265)
                    };
                    self.popup = L.popup(options);
                    self.popup.setContent($("#tweet-popup")[0]);
                }
                else {
                    self.popup.setContent($("#tweet-popup")[0]);
                    self.popup.update();
                }
                self.popup.setLatLng(event.latlng);
                self.map.openPopup(self.popup);
            });
        };
        DashboardMapController.$inject = [
            "$scope",
            "$rootScope",
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
                        center: new L.LatLng(51.51, -0.11),
                        zoom: 12
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
                template: "<div>Testando!</div>",
                link: function (scope, element, attrs) {
                    var rawElement = element[0];
                    var accessToken = "pk.eyJ1IjoibG9raWRnIiwiYSI6IkRfNkpoMHcifQ.m4reSWIhrD5xIJVkrhRAxA";
                    L.mapbox.accessToken = accessToken;
                    var initialPos = L.latLng(-11.372, -57.634);
                    var map = L.mapbox.map(rawElement, "lokidg.i7gg619k").setView(initialPos, 5);
                    scope.$on("destroy", function () { return map.remove(); });
                }
            };
        }
    ]);
})(gogeo || (gogeo = {}));
