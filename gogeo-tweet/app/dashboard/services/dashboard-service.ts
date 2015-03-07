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

        _geomSpaceObservable = new Rx.BehaviorSubject<IGeomSpace>(null);
        _hashtagResultObservable = new Rx.BehaviorSubject<IHashtagResult>(null);
        _hashtagFilterObservable = new Rx.BehaviorSubject<IBucket>(null);

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

        initialize() {
            Rx.Observable
                .merge<any>(this._geomSpaceObservable, this._hashtagFilterObservable)
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

        private searchHashtags(geomSpace:IGeomSpace, hashtag: IBucket) {
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

                var and = filter["and"];

                if (!and) {
                    and = filter.and = {
                        filters: []
                    };
                }

                var queryString = new QueryString(QueryString.HashtagText, this._lastHashtagFilter.key);

                and.filters.push(queryString.build());
            }

            return this.$http.post<IHashtagResult>(url, data);
        }

        search() {
            this.searchHashtags(this._lastGeomSpace, this._lastHashtagFilter)
                .success(result => this._hashtagResultObservable.onNext(result));
        }
    }


    registerService(DashboardService);

}
