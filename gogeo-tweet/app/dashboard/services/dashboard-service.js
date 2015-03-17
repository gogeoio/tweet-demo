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
    var TextQueryBuilder = (function () {
        function TextQueryBuilder(field, term) {
            this.field = field;
            this.term = term;
        }
        TextQueryBuilder.prototype.build = function () {
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
        TextQueryBuilder.HashtagText = "entities.hashtags.text";
        TextQueryBuilder.UserScreenName = "user.screen_name";
        TextQueryBuilder.Text = "text";
        TextQueryBuilder.Place = "place.country";
        return TextQueryBuilder;
    })();
    gogeo.TextQueryBuilder = TextQueryBuilder;
    var DateRangeQueryBuilder = (function () {
        function DateRangeQueryBuilder(field, range) {
            this.field = field;
            this.range = range;
        }
        DateRangeQueryBuilder.prototype.build = function () {
            var query = {
                query: {
                    range: {}
                }
            };
            var fieldRestriction = query.query.range[this.field] = {};
            var range = this.range;
            console.log("date range", this.format(range.start), this.format(range.end));
            if (range.start)
                fieldRestriction["gte"] = this.format(range.start);
            if (range.end)
                fieldRestriction["lte"] = this.format(range.end);
            return query;
        };
        DateRangeQueryBuilder.prototype.format = function (date) {
            return moment(date).format("YYYY-MM-DD");
        };
        DateRangeQueryBuilder.DateRange = "created_at";
        return DateRangeQueryBuilder;
    })();
    gogeo.DateRangeQueryBuilder = DateRangeQueryBuilder;
    var DashboardService = (function () {
        function DashboardService($q, $http, $location, angularytics) {
            this.$q = $q;
            this.$http = $http;
            this.$location = $location;
            this.angularytics = angularytics;
            this._lastGeomSpace = null;
            this._lastHashtagFilter = null;
            this._lastSomethingTerms = [];
            this._lastPlace = null;
            this._lastDateRange = null;
            this._loading = true;
            this._geomSpaceObservable = new Rx.BehaviorSubject(null);
            this._hashtagFilterObservable = new Rx.BehaviorSubject(null);
            this._somethingTermsObservable = new Rx.BehaviorSubject([]);
            this._placeObservable = new Rx.BehaviorSubject(null);
            this._hashtagResultObservable = new Rx.BehaviorSubject(null);
            this._dateRange = new Rx.BehaviorSubject(null);
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
            Rx.Observable.merge(this._geomSpaceObservable, this._hashtagFilterObservable, this._somethingTermsObservable, this._placeObservable, this._dateRange).throttle(800).subscribe(function () { return _this.search(); });
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
        DashboardService.prototype.updateSomethingTerms = function (terms) {
            this._loading = true;
            this._lastSomethingTerms = terms;
            this._somethingTermsObservable.onNext(terms);
        };
        DashboardService.prototype.updatePlace = function (place) {
            this._lastPlace = place;
            this._placeObservable.onNext(place);
        };
        DashboardService.prototype.updateDateRange = function (startDate, endDate) {
            var dateRange = null;
            if (startDate || endDate)
                dateRange = { start: startDate, end: endDate };
            this._lastDateRange = dateRange;
            this._dateRange.onNext(dateRange);
        };
        DashboardService.prototype.publishMetrics = function (action, category, label) {
            if (this.$location.host().match("gogeo.io")) {
                this.angularytics.trackEvent(action, category, label);
            }
        };
        DashboardService.prototype.getTweet = function (latlng, zoom) {
            return this.getTweetData(latlng, zoom);
        };
        DashboardService.prototype.getTweetData = function (latlng, zoom) {
            var url = gogeo.Configuration.makeUrl("geosearch/db1/tweets?mapkey=123");
            var pixelDist = 2575 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8));
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
                q: angular.toJson(query.q) // Essa query e passada como string mesmo
            };
            return this.$http.post(url, data);
        };
        DashboardService.prototype.search = function () {
            var _this = this;
            this._loading = true;
            var query = this.composeQuery();
            query.execute(function (result) {
                _this._loading = false;
                _this._hashtagResultObservable.onNext(result);
            });
            this._lastQueryObservable.onNext(query.requestData.q);
        };
        DashboardService.prototype.composeQuery = function () {
            var query = new DashboardQuery(this.$http, this._lastGeomSpace);
            if (this._lastHashtagFilter) {
                this.publishMetrics("click", "hashtags", this._lastHashtagFilter.key);
                query.filterByHashtag(this._lastHashtagFilter);
            }
            if (this._lastSomethingTerms.length > 0) {
                //this.publishMetrics("search", "search", this._lastSearchTerm);
                query.filterBySearchTerms(this._lastSomethingTerms);
            }
            if (this._lastPlace) {
                query.filterByPlace(this._lastPlace);
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
        DashboardQuery.prototype.getOrCreateAndRestriction = function (filter) {
            var and = filter["and"];
            if (!and) {
                and = filter.and = {
                    filters: []
                };
            }
            return and;
        };
        DashboardQuery.prototype.filterBySearchTerms = function (terms) {
            for (var i = 0; i < terms.length; i++) {
                this.filterBySearchTerm(terms[i]);
            }
        };
        DashboardQuery.prototype.filterBySearchTerm = function (term) {
            var _this = this;
            Enumerable.from(term.split(' ')).select(function (entry) { return entry.trim(); }).where(function (entry) { return entry != null && entry.length > 0; }).forEach(function (entry) {
                switch (entry.charAt(0)) {
                    case "@":
                        _this.filterByUsername(entry.substring(1));
                        break;
                    case "#":
                        _this.filterByHashtag({
                            key: entry.substring(1),
                            doc_count: 0
                        });
                        break;
                    default:
                        _this.filterByText(term);
                        break;
                }
            });
        };
        DashboardQuery.prototype.filterByHashtag = function (hashtag) {
            var filter = this.requestData.q.query.filtered.filter;
            if (hashtag) {
                this.requestData["field"] = "place.full_name";
                this.requestData["agg_size"] = 5;
                var and = this.getOrCreateAndRestriction(filter);
                var queryString = new TextQueryBuilder(TextQueryBuilder.HashtagText, hashtag.key);
                and.filters.push(queryString.build());
            }
        };
        DashboardQuery.prototype.filterByUsername = function (username) {
            var filter = this.requestData.q.query.filtered.filter;
            var and = this.getOrCreateAndRestriction(filter);
            var queryString = new TextQueryBuilder(TextQueryBuilder.UserScreenName, username + "*");
            and.filters.push(queryString.build());
        };
        DashboardQuery.prototype.filterByText = function (text) {
            var filter = this.requestData.q.query.filtered.filter;
            var and = this.getOrCreateAndRestriction(filter);
            var queryString = new TextQueryBuilder(TextQueryBuilder.Text, text);
            and.filters.push(queryString.build());
        };
        DashboardQuery.prototype.filterByPlace = function (text) {
            var filter = this.requestData.q.query.filtered.filter;
            var and = this.getOrCreateAndRestriction(filter);
            var queryString = new TextQueryBuilder(TextQueryBuilder.Place, text + "*");
            and.filters.push(queryString.build());
        };
        DashboardQuery.prototype.filterByDateRange = function (range) {
            var filter = this.requestData.q.query.filtered.filter;
            var and = this.getOrCreateAndRestriction(filter);
            var queryString = new DateRangeQueryBuilder(DateRangeQueryBuilder.DateRange, range);
            and.filters.push(queryString.build());
        };
        DashboardQuery.prototype.execute = function (resultHandler) {
            var url = gogeo.Configuration.makeUrl("geoagg/db1/tweets?mapkey=123");
            return this.$http.post(url, this.requestData).success(resultHandler);
        };
        return DashboardQuery;
    })();
    gogeo.registerService(DashboardService);
})(gogeo || (gogeo = {}));
//# sourceMappingURL=dashboard-service.js.map