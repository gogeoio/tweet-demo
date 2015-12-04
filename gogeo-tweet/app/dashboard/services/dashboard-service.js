var gogeo;
(function (gogeo) {
    var DashboardService = (function () {
        function DashboardService($q, $http, $location, $timeout, $routeParams) {
            this.$q = $q;
            this.$http = $http;
            this.$location = $location;
            this.$timeout = $timeout;
            this.$routeParams = $routeParams;
            this._lastGeomSpace = null;
            this._lastHashtagFilter = null;
            this._lastSomethingTerms = [];
            this._lastPlaceCode = null;
            this._lastPlaceString = null;
            this._lastDateRange = null;
            this._lastMapCenter = null;
            this._lastMapZoom = 0;
            this._lastMapType = null;
            this._lastMapBase = null;
            this._loading = true;
            this.tweetFields = [
                "user.id",
                "user.name",
                "user.screen_name",
                "user.profile_image_url",
                "place.full_name",
                "created_at",
                "text",
                "source"
            ];
            this._geomSpaceObservable = new Rx.BehaviorSubject(null);
            this._hashtagFilterObservable = new Rx.BehaviorSubject(null);
            this._somethingTermsObservable = new Rx.BehaviorSubject([]);
            this._placeObservable = new Rx.BehaviorSubject(null);
            this._hashtagResultObservable = new Rx.BehaviorSubject(null);
            this._dateRangeObservable = new Rx.BehaviorSubject(null);
            this._lastQueryObservable = new Rx.BehaviorSubject(null);
            this._tweetObservable = new Rx.BehaviorSubject(null);
            this._dateLimitObservable = new Rx.BehaviorSubject(null);
            this._placeBoundObservable = new Rx.BehaviorSubject(null);
            this._loadParamsObservable = new Rx.BehaviorSubject(null);
            this.initialize();
            this.getDateRange();
            this.loadParams();
        }
        DashboardService.prototype.loadParams = function () {
            var _this = this;
            this._loadParamsObservable.onNext(this.$routeParams);
            this.$timeout(function () {
                _this.$location.search({});
            }, 200);
        };
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
        Object.defineProperty(DashboardService.prototype, "hashtagFilterObservable", {
            get: function () {
                return this._hashtagFilterObservable;
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
        Object.defineProperty(DashboardService.prototype, "dateRangeObsersable", {
            get: function () {
                return this._dateRangeObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "somethingTermsObservable", {
            get: function () {
                return this._somethingTermsObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "placeObservable", {
            get: function () {
                return this._placeObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "tweetObservable", {
            get: function () {
                return this._tweetObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "dateLimitObservable", {
            get: function () {
                return this._dateLimitObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "placeBoundObservable", {
            get: function () {
                return this._placeBoundObservable;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DashboardService.prototype, "loadParamsObservable", {
            get: function () {
                return this._loadParamsObservable;
            },
            enumerable: true,
            configurable: true
        });
        DashboardService.prototype.initialize = function () {
            var _this = this;
            Rx.Observable
                .merge(this._geomSpaceObservable, this._hashtagFilterObservable, this._dateRangeObservable)
                .throttle(400)
                .subscribe(function () { return _this.search(); });
            Rx.Observable
                .merge(this._somethingTermsObservable, this._placeObservable)
                .throttle(800)
                .subscribe(function () { return _this.search(); });
        };
        DashboardService.prototype.getBoundOfPlace = function (placeString) {
            var _this = this;
            if (placeString) {
                var url = gogeo.Configuration.getPlaceUrl(placeString);
                this.$http.get(url).then(function (result) {
                    var place = result.data["place"];
                    var bb = place["bounding_box"];
                    var p1 = bb["coordinates"][0];
                    var p2 = bb["coordinates"][1];
                    var country_code = place["country_code"];
                    var point1 = L.latLng(p1[1], p1[0]);
                    var point2 = L.latLng(p2[1], p2[0]);
                    var bounds = L.latLngBounds(point1, point2);
                    _this._placeBoundObservable.onNext(bounds);
                    _this._lastPlaceCode = country_code;
                    _this._lastPlaceString = placeString;
                    _this._placeObservable.onNext(country_code);
                });
            }
            else {
                this._lastPlaceCode = null;
                this._lastPlaceString = null;
                this._placeObservable.onNext(this._lastPlaceCode);
            }
        };
        DashboardService.prototype.calculateNeSW = function (bounds) {
            var ne = new L.LatLng(bounds.getNorthEast().lng, bounds.getNorthEast().lat);
            var sw = new L.LatLng(bounds.getSouthWest().lng, bounds.getSouthWest().lat);
            return new gogeo.NeSwPoint(ne, sw);
        };
        DashboardService.prototype.pointToGeoJson = function (point) {
            var ne = [point.ne.lat, point.ne.lng];
            var sw = [point.sw.lat, point.sw.lng];
            var nw = [sw[0], ne[1]];
            var se = [ne[0], sw[1]];
            var coordinates = [
                [
                    sw, nw, ne, se, sw
                ]
            ];
            return {
                source: "mapBounds",
                type: "Polygon",
                coordinates: coordinates
            };
        };
        DashboardService.prototype.createShareLink = function (type) {
            var _this = this;
            var url = "?share";
            if (this._lastPlaceString && this._lastPlaceCode) {
                url = url + "&where=" + this._lastPlaceString;
            }
            else {
                if (this._lastMapCenter) {
                    var point = this._lastMapCenter;
                    var lat = point.lat.toFixed(2);
                    var lng = point.lng.toFixed(2);
                    url = url + "&center=" + lat + "," + lng;
                }
                if (this._lastMapZoom) {
                    url = url + "&zoom=" + this._lastMapZoom;
                }
            }
            if (this._lastDateRange.start) {
                var dateFormatted = moment(this._lastDateRange.start).format("MM/DD/YYYY");
                url = url + "&startDate=" + dateFormatted;
            }
            if (this._lastDateRange.end) {
                var dateFormatted = moment(this._lastDateRange.end).format("MM/DD/YYYY");
                url = url + "&endDate=" + dateFormatted;
            }
            if (this._lastSomethingTerms) {
                var terms = [];
                for (var index in this._lastSomethingTerms) {
                    var term = this._lastSomethingTerms[index];
                    term = term.replace("#", "%23");
                    terms.push(term);
                }
                url = url + "&what=" + terms.join(" ");
            }
            if (this._lastMapType) {
                url = url + "&type=" + this._lastMapType;
            }
            if (this._lastMapBase) {
                url = url + "&baseLayer=" + this._lastMapBase;
            }
            url = "http://twittermap.gogeo.io/app/#/dashboard" + url;
            var shortenUrl = gogeo.Configuration.getShortenUrl() + "?url=" + encodeURIComponent(url);
            this.$http.get(shortenUrl).then(function (result) {
                var tweetUrl = result.data["data"]["url"];
                _this.openShare(type, tweetUrl);
            }, function (data) {
                _this.openShare(type, url);
            });
            return url;
        };
        DashboardService.prototype.openShare = function (type, url) {
            if (type === "twitter") {
                this.twitterShare(url);
            }
            else if (type === "facebook") {
                this.facebookShare(url);
            }
        };
        DashboardService.prototype.twitterShare = function (url) {
            var params = [
                "url=" + encodeURIComponent(url),
                "via=gogeo_io",
                "hashtags=gogeo,gogeo_io,twittermap",
                "text=" + encodeURIComponent("Check out the live tweets on the map")
            ];
            var url = 'http://twitter.com/share?' + params.join("&");
            var sharePopOptions = 'height=450, width=550, top=' + ($(window).height() / 2 - 225) + ', left=' + $(window).width() / 2 + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0';
            window.open(url, 'twitterwindow', sharePopOptions);
        };
        DashboardService.prototype.facebookShare = function (url) {
            var params = [
                "app_id=873202776080901",
                "sdk=joey",
                "u=" + encodeURIComponent(url),
                "display=popup",
                "ref=plugin",
                "src=share_button"
            ];
            var url = 'https://www.facebook.com/sharer/sharer.php?' + params.join("&");
            var sharePopOptions = 'height=450, width=650, top=' + ($(window).height() / 2 - 225) + ', left=' + $(window).width() / 2 + ', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0';
            window.open(url, 'facebookwindow', sharePopOptions);
        };
        DashboardService.prototype.updateGeomSpace = function (geom) {
            this._loading = true;
            this._lastGeomSpace = geom;
            this._geomSpaceObservable.onNext(geom);
        };
        DashboardService.prototype.updateGeomSpaceByBounds = function (bounds) {
            var point = this.calculateNeSW(bounds);
            var geomSpace = this.pointToGeoJson(point);
            if (geomSpace) {
                this.updateGeomSpace(geomSpace);
            }
        };
        DashboardService.prototype.updateHashtagBucket = function (bucket) {
            this._loading = true;
            this._lastHashtagFilter = bucket;
            this._hashtagFilterObservable.onNext(bucket);
        };
        DashboardService.prototype.updateSomethingTerms = function (terms) {
            this._loading = true;
            this._lastSomethingTerms = terms;
            this._somethingTermsObservable.onNext(terms);
        };
        DashboardService.prototype.updatePlace = function (place) {
            this.getBoundOfPlace(place);
        };
        DashboardService.prototype.updateDateRange = function (startDate, endDate) {
            var dateRange = null;
            if (startDate || endDate) {
                dateRange = { start: startDate, end: endDate };
            }
            this._lastDateRange = dateRange;
            this._dateRangeObservable.onNext(dateRange);
        };
        DashboardService.prototype.updateMapCenter = function (mapCenter) {
            this._lastMapCenter = mapCenter;
        };
        DashboardService.prototype.updateMapZoom = function (mapZoom) {
            this._lastMapZoom = mapZoom;
        };
        DashboardService.prototype.updateMapType = function (mapType) {
            this._lastMapType = mapType;
        };
        DashboardService.prototype.updateMapBase = function (mapBase) {
            this._lastMapBase = mapBase;
        };
        DashboardService.prototype.getTweet = function (latlng, zoom, thematicQuery) {
            return this.getTweetData(latlng, zoom, thematicQuery);
        };
        DashboardService.prototype.getDateRange = function () {
            var _this = this;
            if (!this.$location.search()["startDate"] && !this.$location.search()["endDate"]) {
                this.$http.get(gogeo.Configuration.getDateRangeUrl()).then(function (result) {
                    _this._dateLimitObservable.onNext(result.data);
                });
            }
        };
        DashboardService.prototype.getTweetData = function (latlng, zoom, thematicQuery) {
            var _this = this;
            var url = gogeo.Configuration.makeUrl("geosearch/db1/" + gogeo.Configuration.getCollectionName() + "?mapkey=123");
            var pixelDist = 40075 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8)) * 8;
            if (pixelDist > 32)
                pixelDist = 32;
            var query = this.composeQuery().requestData.q;
            if (thematicQuery) {
                query = thematicQuery.build();
            }
            var geom = {
                type: "Point",
                coordinates: [
                    latlng.lng, latlng.lat
                ]
            };
            var geosearch = new gogeo.GogeoGeosearch(this.$http, geom, pixelDist, "degree", this.tweetFields, 1, query);
            geosearch.execute(function (result) {
                _this._tweetObservable.onNext(result);
            });
        };
        DashboardService.prototype.totalTweets = function () {
            var url = gogeo.Configuration.getTotalTweetsUrl();
            return this.$http.get(url);
        };
        DashboardService.prototype.search = function () {
            var _this = this;
            if (!this._lastGeomSpace) {
                return;
            }
            this._loading = true;
            var query = this.composeQuery();
            query.execute(function (result) {
                _this._loading = false;
                _this._hashtagResultObservable.onNext(result);
            });
            this._lastQueryObservable.onNext(query.requestData.q);
        };
        DashboardService.prototype.composeQuery = function () {
            var query = new gogeo.DashboardQuery(this.$http, this._lastGeomSpace);
            if (this._lastHashtagFilter) {
                query.filterByHashtag(this._lastHashtagFilter);
            }
            if (this._lastSomethingTerms.length > 0) {
                query.filterBySearchTerms(this._lastSomethingTerms);
            }
            if (this._lastPlaceCode) {
                query.filterByPlace(this._lastPlaceCode);
            }
            if (this._lastDateRange) {
                query.filterByDateRange(this._lastDateRange);
            }
            return query;
        };
        DashboardService.$named = "dashboardService";
        DashboardService.$inject = [
            "$q",
            "$http",
            "$location",
            "$timeout",
            "$routeParams"
        ];
        return DashboardService;
    })();
    gogeo.DashboardService = DashboardService;
    gogeo.registerService(DashboardService);
})(gogeo || (gogeo = {}));
