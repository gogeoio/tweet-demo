/// <reference path="../../shell.ts" />

/**
 * Created by danfma on 07/03/15.
 */

module gogeo {

    export class NeSwPoint {
        constructor(public ne:L.LatLng, public sw:L.LatLng) {

        }
    }

    export class QueryString {
        static HashtagText = "entities.hashtags.text";
        static UserScreenName = "user.screen_name";

        constructor(public field:string, public term:string) {

        }

        build() {
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
        }
    }

    export interface IGeomSpace {
        type: string;
        coordinates: Array<Array<Array<number>>>;
    }

    export interface IBucket {
        key: string;
        doc_count: number;
    }

    export interface IHashtagResult {
        doc_total: number;
        buckets: Array<IBucket>;
    }

    export interface ITweet {
        created_at: string;
        id: string;
        text: string;
        source: string;
        truncated: boolean;
        in_reply_to_status_id: number;
        in_reply_to_user_id: number;
        in_reply_to_screen_name: string;
        retweet_count: number;
        favorite_count: number;
        favorited: boolean;
        retweeted: boolean;
        lang: string;
        timestamp_ms: number;
        "user.name": string;
        "user.screen_name": string;
        "user.profile_image_url": string;
    }

    export class DashboardService {
        static $named = "dashboardService";
        static $inject = [
            "$q",
            "$http",
            "$location",
            "Angularytics"
        ];

        private _lastGeomSpace:IGeomSpace = null;
        private _lastHashtagFilter:IBucket = null;
        private _lastSearchTerm:string = null;
        private _loading: boolean = true;

        _geomSpaceObservable = new Rx.BehaviorSubject<IGeomSpace>(null);
        _hashtagFilterObservable = new Rx.BehaviorSubject<IBucket>(null);
        _somethingTermObservable = new Rx.BehaviorSubject<string>(null);
        _hashtagResultObservable = new Rx.BehaviorSubject<IHashtagResult>(null);
        _lastQueryObservable = new Rx.BehaviorSubject<any>(null);

        constructor(private $q:ng.IQService,
                    private $http:ng.IHttpService,
                    private $location: ng.ILocationService,
                    private angularytics: angularytics.Angularytics) {
            this.initialize();
            if (this.$location.host().match("gogeo.io")) {
                this.angularytics.trackPageView("/");
            }
        }

        get loading(): boolean {
            return this._loading;
        }

        public isLoading(): boolean {
            return this._loading;
        }

        get geomSpaceObservable():Rx.Observable<IGeomSpace> {
            return this._geomSpaceObservable;
        }

        get hashtagResultObservable():Rx.Observable<IHashtagResult> {
            return this._hashtagResultObservable;
        }

        get queryObservable():Rx.Observable<any> {
            return this._lastQueryObservable;
        }

        initialize() {
            Rx.Observable
                .merge<any>(this._geomSpaceObservable, this._hashtagFilterObservable, this._somethingTermObservable)
                .throttle(800)
                .subscribe(() => this.search());
        }

        private calculateNeSW(bounds:L.LatLngBounds) {
            var ne = new L.LatLng(bounds.getNorthEast().lng, bounds.getNorthEast().lat);
            var sw = new L.LatLng(bounds.getSouthWest().lng, bounds.getSouthWest().lat);

            return new NeSwPoint(ne, sw);
        }

        private pointToGeoJson(point:NeSwPoint):IGeomSpace {
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
                type: "Polygon",
                coordinates: coordinates
            }
        }

        updateGeomSpace(geom:IGeomSpace) {
            this._lastGeomSpace = geom;
            this._geomSpaceObservable.onNext(geom);
        }

        updateGeomSpaceByBounds(bounds:L.LatLngBounds) {
            this._loading = true;
            var point = this.calculateNeSW(bounds);
            var geomSpace = this.pointToGeoJson(point);
            this.updateGeomSpace(geomSpace);
        }

        updateHashtagBucket(bucket: IBucket) {
            this._loading = true;
            this._lastHashtagFilter = bucket;
            this._hashtagFilterObservable.onNext(bucket);
        }

        updateSearchTerm(term: string) {
            this._loading = true;
            this._lastSearchTerm = term;
            this._somethingTermObservable.onNext(term);
        }

        publishMetrics(action: string, category: string, label: string) {
            if (this.$location.host().match("gogeo.io")) {
                this.angularytics.trackEvent(action, category, label);
            }
        }

        getTweet(latlng: L.LatLng, zoom: number) {
            return this.getTweetData(latlng, zoom);
        }

        private getTweetData(latlng: L.LatLng, zoom: number) {
            var url = "http://api.gogeo.io/1.0/geosearch/db1/tweets?mapkey=123";

            var pixelDist = 40075 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8));

            console.log('zoom', zoom, 'pixelDist', pixelDist);

            var query = this.composeQuery().requestData;

            var data:any = {
                geom: {
                    type: "Point",
                    coordinates: [
                        latlng.lng, latlng.lat
                    ]
                },
                limit: 1,
                buffer: pixelDist * 16,
                buffer_measure: "kilometer",
                fields: [
                    // user
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
                    // place
                    "place.id",
                    "place.url",
                    "place.place_type",
                    "place.full_name",
                    "place.country_code",
                    "place.country",
                    // tweet
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

            return this.$http.post<ITweet>(url, data);
        }

        search() {
            this._loading = true;

            var query = this.composeQuery();

            var self = this;
            query.execute(
                function(result) {
                    self._loading = false;
                    self._hashtagResultObservable.onNext(result);
                }
            );
            this._lastQueryObservable.onNext(query.requestData.q);
        }

        composeQuery(): DashboardQuery {
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
        }
    }

    class DashboardQuery {
        requestData: any = {};

        constructor(private $http: ng.IHttpService, geomSpace: IGeomSpace) {
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

        filterByHashtag(hashtag: IBucket) {
            var filter:any = this.requestData.q.query.filtered.filter;

            if (hashtag) {
                this.requestData["field"] = "place.full_name.raw";
                this.requestData["agg_size"] = 5;

                var and = this.getOrCreateAndRestriction(filter);
                var queryString = new QueryString(QueryString.HashtagText, hashtag.key);

                and.filters.push(queryString.build());
            }
        }

        filterBySearchTerm(term: string) {
            var usernamePattern = /^@[a-zA-Z_]\w*\*?$/;

            Enumerable.from(term.split(' '))
                .select(entry => entry.trim())
                .where(entry => entry != null && entry.length > 0)
                .forEach(entry => {
                    if (usernamePattern.test(entry)) {
                        this.filterByUsername(entry.substring(1)); // skipping the @
                    }
                });
        }

        filterByUsername(username: string) {
            var filter:any = this.requestData.q.query.filtered.filter;
            var and = this.getOrCreateAndRestriction(filter);
            var queryString = new QueryString(QueryString.UserScreenName, username);

            and.filters.push(queryString.build());
        }

        getOrCreateAndRestriction(filter:any) {
            var and = filter["and"];

            if (!and) {
                and = filter.and = {
                    filters: []
                };
            }

            return and;
        }

        execute(resultHandler:(IHashtagResult) => void) {
            var url = "http://api.gogeo.io/1.0/geoagg/db1/tweets?mapkey=123";

            return this.$http
                .post(url, this.requestData)
                .success(resultHandler);
        }
    }


    registerService(DashboardService);

}
