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

        constructor(public field: string, public term: string) {

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


    export class DashboardService {
        static $named = "dashboardService";
        static $inject = [
            "$q",
            "$http"
        ];

        private _lastGeomSpace: IGeomSpace = null;
        private _lastHashtagFilter: IBucket = null;
        private _lastSomethingTerm: string = null;

        _geomSpaceObservable = new Rx.BehaviorSubject<IGeomSpace>(null);
        _hashtagFilterObservable = new Rx.BehaviorSubject<IBucket>(null);
        _somethingTermObservable = new Rx.BehaviorSubject<string>(null);
        _hashtagResultObservable = new Rx.BehaviorSubject<IHashtagResult>(null);
        _lastQueryObservable = new Rx.BehaviorSubject<any>(null);

        constructor(private $q:ng.IQService,
                    private $http:ng.IHttpService) {
            this.initialize();
        }

        get geomSpaceObservable():Rx.Observable<IGeomSpace> {
            return this._geomSpaceObservable;
        }

        get hashtagResultObservable():Rx.Observable<IHashtagResult> {
            return this._hashtagResultObservable;
        }

        get queryObservable(): Rx.Observable<any> {
            return this._lastQueryObservable;
        }

        initialize() {
            Rx.Observable
                .merge<any>(this._geomSpaceObservable, this._hashtagFilterObservable, this._somethingTermObservable)
                .throttle(400)
                .subscribe(() => this.search());
        }

        updateGeomSpace(geom:IGeomSpace) {
            this._lastGeomSpace = geom;
            this._geomSpaceObservable.onNext(geom);
        }

        updateGeomSpaceByBounds(bounds:L.LatLngBounds) {
            var point = this.calculateNeSW(bounds);
            var geomSpace = this.pointToGeoJson(point);

            this.updateGeomSpace(geomSpace);
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

        updateHashtagBucket(bucket:IBucket) {
            this._lastHashtagFilter = bucket;
            this._hashtagFilterObservable.onNext(bucket);
        }

        updateSomethingTerm(term: string) {
            this._lastSomethingTerm = term;
            this._somethingTermObservable.onNext(term);
        }

        private searchHashtags() {
            var geomSpace = this._lastGeomSpace;
            var hashtag = this._lastHashtagFilter;
            var somethingTerm = this._lastSomethingTerm;
            var url = "https://api.gogeo.io/1.0/geoagg/db1/tweets?mapkey=123";

            var data: any = {
                agg_size: 10,
                field: "entities.hashtags.text",
                geom: geomSpace,
                q: {
                    query: {
                        filtered: {
                            filter: {

                            }
                        }
                    }
                }
            };

            var filter: any = data.q.query.filtered.filter;

            if (hashtag) {
                data["field"] = "place.full_name.raw";

                var and = this.getAndRestriction(filter);
                var queryString = new QueryString(QueryString.HashtagText, hashtag.key);

                and.filters.push(queryString.build());
            }

            if (somethingTerm) {
                var and = this.getAndRestriction(filter);
                var queryString = new QueryString(QueryString.UserScreenName, somethingTerm);

                and.filters.push(queryString.build());
            }

            this._lastQueryObservable.onNext(data.q);

            return this.$http.post<IHashtagResult>(url, data);
        }

        getAndRestriction(filter: any) {
            var and = filter["and"];

            if (!and) {
                and = filter.and = {
                    filters: []
                };
            }

            return and;
        }

        search() {
            this.searchHashtags()
                .success(result => this._hashtagResultObservable.onNext(result));
        }
    }


    registerService(DashboardService);

}
