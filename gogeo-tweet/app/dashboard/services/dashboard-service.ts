///<reference path="../../shell.ts" />
///<reference path="../../shared/controls/queries.ts"/>
///<reference path="../../shared/controls/dashboard-query.ts"/>
///<reference path="./metrics.ts"/>

/**
 * Created by danfma on 07/03/15.
 */

module gogeo {

    export class DashboardService {
        static $named = "dashboardService";
        static $inject = [
            "$q",
            "$http"
        ];

        private _lastGeomSpace:IGeomSpace = null;
        private _lastHashtagFilter:IBucket = null;
        private _lastSomethingTerms:string[] = [];
        private _lastPlace: string = null;
        private _lastDateRange: IDateRange = null;
        private _loading: boolean = true;

        _geomSpaceObservable = new Rx.BehaviorSubject<IGeomSpace>(null);
        _hashtagFilterObservable = new Rx.BehaviorSubject<IBucket>(null);
        _somethingTermsObservable = new Rx.BehaviorSubject<string[]>([]);
        _placeObservable = new Rx.BehaviorSubject<string>(null);
        _hashtagResultObservable = new Rx.BehaviorSubject<IHashtagResult>(null);
        _dateRangeObsersable = new Rx.BehaviorSubject<IDateRange>(null);
        _lastQueryObservable = new Rx.BehaviorSubject<any>(null);
        _tweetObservable = new Rx.BehaviorSubject<ITweet>(null);

        constructor(private $q:ng.IQService,
                    private $http:ng.IHttpService) {

            this.initialize();
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

        get hashtagFilterObservable():Rx.Observable<IBucket> {
            return this._hashtagFilterObservable;
        }

        get queryObservable():Rx.Observable<any> {
            return this._lastQueryObservable;
        }

        get dateRangeObsersable():Rx.Observable<IDateRange> {
            return this._dateRangeObsersable;
        }

        get somethingTermsObservable():Rx.BehaviorSubject<string[]> {
            return this._somethingTermsObservable;
        }

        get placeObservable():Rx.BehaviorSubject<string> {
            return this._placeObservable;
        }

        get tweetObservable():Rx.BehaviorSubject<ITweet> {
            return this._tweetObservable;
        }

        initialize() {
            Rx.Observable
                .merge<any>(this._geomSpaceObservable, this._hashtagFilterObservable, this._dateRangeObsersable)
                .throttle(400)
                .subscribe(() => this.search());

            Rx.Observable
                .merge<any>(this._somethingTermsObservable, this._placeObservable)
                .throttle(800)
                .subscribe(() => this.search());
        }

        private calculateNeSW(bounds: L.LatLngBounds) {
            var ne = new L.LatLng(bounds.getNorthEast().lng, bounds.getNorthEast().lat);
            var sw = new L.LatLng(bounds.getSouthWest().lng, bounds.getSouthWest().lat);

            return new NeSwPoint(ne, sw);
        }

        private pointToGeoJson(point: NeSwPoint): IGeomSpace {
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
            }
        }

        updateGeomSpace(geom: IGeomSpace) {
            this._loading = true;
            this._lastGeomSpace = geom;
            this._geomSpaceObservable.onNext(geom);
        }

        updateGeomSpaceByBounds(bounds: L.LatLngBounds) {
            var point = this.calculateNeSW(bounds);
            var geomSpace = this.pointToGeoJson(point);

            if (geomSpace) {
                this.updateGeomSpace(geomSpace);
            }
        }

        updateHashtagBucket(bucket: IBucket) {
            this._loading = true;
            this._lastHashtagFilter = bucket;
            this._hashtagFilterObservable.onNext(bucket);
        }

        updateSomethingTerms(terms: string[]) {
            this._loading = true;
            this._lastSomethingTerms = terms;
            this._somethingTermsObservable.onNext(terms);
        }

        updatePlace(place: string) {
            this._lastPlace = place;
            this._placeObservable.onNext(place);
        }

        updateDateRange(startDate: Date, endDate: Date) {
            var dateRange: IDateRange = null;

            if (startDate || endDate) {
                dateRange = { start: startDate, end: endDate };
            }

            this._lastDateRange = dateRange;
            this._dateRangeObsersable.onNext(dateRange);
        }

        getTweet(latlng: L.LatLng, zoom: number, thematicQuery?: ThematicQuery) {
            return this.getTweetData(latlng, zoom, thematicQuery);
        }

        private getTweetData(latlng: L.LatLng, zoom: number, thematicQuery?: ThematicQuery) {
            var url = Configuration.makeUrl("geosearch/db1/tweets?mapkey=123");
            var pixelDist = 2575 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8));
            var query = this.composeQuery().requestData.q;

            if (thematicQuery) {
                query = thematicQuery.build();
            }

            var data:any = {
                geom: {
                    type: "Point",
                    coordinates: [
                        latlng.lng, latlng.lat
                    ]
                },
                limit: 1,
                buffer: pixelDist,
                buffer_measure: "degree",
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
                q: angular.toJson(query) // Essa query e passada como string mesmo
            };

            var tweet = this.$http.post<ITweet>(url, data);
            tweet.then((result) => {
                this._tweetObservable.onNext(result.data);
            });
            return tweet;
        }

        search() {
            this._loading = true;

            var query = this.composeQuery();

            query.execute(
                (result) => {
                    this._loading = false;
                    this._hashtagResultObservable.onNext(result);
                }
            );

            this._lastQueryObservable.onNext(query.requestData.q);
        }

        composeQuery(): DashboardQuery {
            var query = new DashboardQuery(this.$http, this._lastGeomSpace);

            if (this._lastHashtagFilter) {
                query.filterByHashtag(this._lastHashtagFilter);
            }

            if (this._lastSomethingTerms.length > 0) {
                query.filterBySearchTerms(this._lastSomethingTerms);
            }

            if (this._lastPlace) {
                query.filterByPlace(this._lastPlace);
            }

            if (this._lastDateRange) {
                query.filterByDateRange(this._lastDateRange);
            }

            return query;
        }
    }

    registerService(DashboardService);

}
