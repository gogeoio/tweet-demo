///<reference path="../../shell.ts" />
///<reference path="../../shared/controls/queries.ts"/>
///<reference path="../../shared/controls/dashboard-query.ts"/>
///<reference path="../../shared/controls/gogeo-geosearch.ts"/>
///<reference path="../../shared/controls/gogeo-geoagg.ts"/>
///<reference path="./metrics.ts"/>

/**
 * Created by danfma on 07/03/15.
 */

module gogeo {
    export interface TotalTweets {
        count: number;
    }

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

        private tweetFields: Array<string> = [
            // user
            "user.id",
            "user.name",
            "user.screen_name",
            "user.profile_image_url",
            // place
            "place.full_name",
            // tweet
            "created_at",
            "text",
            "source"
        ];

        private worldBound: IGeom = {
            type: "Polygon",
            coordinates: [
              [
                [
                  -201.09375,
                  -81.97243132048264
                ],
                [
                  -201.09375,
                  84.86578186731522
                ],
                [
                  201.09375,
                  84.86578186731522
                ],
                [
                  201.09375,
                  -81.97243132048264
                ],
                [
                  -201.09375,
                  -81.97243132048264
                ]
              ]
            ]
        };

        _geomSpaceObservable = new Rx.BehaviorSubject<IGeomSpace>(null);
        _hashtagFilterObservable = new Rx.BehaviorSubject<IBucket>(null);
        _somethingTermsObservable = new Rx.BehaviorSubject<string[]>([]);
        _placeObservable = new Rx.BehaviorSubject<string>(null);
        _hashtagResultObservable = new Rx.BehaviorSubject<IHashtagResult>(null);
        _dateRangeObservable = new Rx.BehaviorSubject<IDateRange>(null);
        _lastQueryObservable = new Rx.BehaviorSubject<any>(null);
        _tweetObservable = new Rx.BehaviorSubject<Array<ITweet>>(null);
        _dateLimitObservable = new Rx.BehaviorSubject<any>(null);

        constructor(private $q:ng.IQService,
                    private $http:ng.IHttpService) {

            this.initialize();
            this.getDateRange();
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
            return this._dateRangeObservable;
        }

        get somethingTermsObservable():Rx.BehaviorSubject<string[]> {
            return this._somethingTermsObservable;
        }

        get placeObservable():Rx.BehaviorSubject<string> {
            return this._placeObservable;
        }

        get tweetObservable():Rx.BehaviorSubject<Array<ITweet>> {
            return this._tweetObservable;
        }

        get dateLimitObservable():Rx.BehaviorSubject<any> {
            return this._dateLimitObservable;
        }

        initialize() {
            Rx.Observable
                .merge<any>(this._geomSpaceObservable, this._hashtagFilterObservable, this._dateRangeObservable)
                .throttle(400)
                .subscribe(() => this.search());

            Rx.Observable
                .merge<any>(this._somethingTermsObservable, this._placeObservable)
                .throttle(800)
                .subscribe(() => this.search());

            Rx.Observable
                .merge<any>(this._placeObservable)
                .throttle(800)
                .subscribe(() => this.getBoundOfPlace());
        }

        private getBoundOfPlace() {
            if (this._lastPlace) {
                var fields = [
                    "place.full_name",
                    "place.country",
                    "place.bounding_box.coordinates"
                ];

                var query = new TextQueryBuilder(["place.country"], this._lastPlace);
                var geosearch = new GogeoGeosearch(this.$http, this.worldBound, 0, null, fields, 1, query.build());

                // geosearch.execute((result: Array<ITweet>) => {
                //     console.log("result", result);
                // });
            }
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
            this._dateRangeObservable.onNext(dateRange);
        }

        getTweet(latlng: L.LatLng, zoom: number, thematicQuery?: ThematicQuery) {
            return this.getTweetData(latlng, zoom, thematicQuery);
        }

        getDateRange() {
            this.$http.get(Configuration.getDateRangeUrl()).then((result: any) => {
                this._dateLimitObservable.onNext(result.data);
            });
        }

        private getTweetData(latlng: L.LatLng, zoom: number, thematicQuery?: ThematicQuery) {
            var url = Configuration.makeUrl("geosearch/db1/" + Configuration.getCollectionName() + "?mapkey=123");
            var pixelDist = 2575 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8));
            var query = this.composeQuery().requestData.q;

            if (thematicQuery) {
                query = thematicQuery.build();
            }

            var geom = <IGeom>{
                type: "Point",
                coordinates: [
                    latlng.lng, latlng.lat
                ]
            };

            var geosearch = new GogeoGeosearch(this.$http, geom, pixelDist, "degree", this.tweetFields, 1, query);
            geosearch.execute((result: Array<ITweet>) => {
                this._tweetObservable.onNext(result);
            });
        }

        totalTweets() {
            var url = Configuration.getTotalTweetsUrl();
            return this.$http.get(url);
        }

        search() {
            if (!this._lastGeomSpace) {
                return;
            }

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
