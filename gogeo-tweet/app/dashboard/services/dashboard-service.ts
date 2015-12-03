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
            "$http",
            "$location",
            "$timeout",
            "$routeParams"
        ];

        private _lastGeomSpace:IGeomSpace = null;
        private _lastHashtagFilter:IBucket = null;
        private _lastSomethingTerms:string[] = [];
        private _lastPlaceCode: string = null;
        private _lastPlaceString: string = null;
        private _lastDateRange: IDateRange = null;
        private _lastMapCenter: L.LatLng = null;
        private _lastMapZoom: number = 0;
        private _lastMapType: string = null;
        private _lastMapBase: string = null;
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

        _geomSpaceObservable = new Rx.BehaviorSubject<IGeomSpace>(null);
        _hashtagFilterObservable = new Rx.BehaviorSubject<IBucket>(null);
        _somethingTermsObservable = new Rx.BehaviorSubject<string[]>([]);
        _placeObservable = new Rx.BehaviorSubject<string>(null);
        _hashtagResultObservable = new Rx.BehaviorSubject<IHashtagResult>(null);
        _dateRangeObservable = new Rx.BehaviorSubject<IDateRange>(null);
        _lastQueryObservable = new Rx.BehaviorSubject<any>(null);
        _tweetObservable = new Rx.BehaviorSubject<Array<ITweet>>(null);
        _dateLimitObservable = new Rx.BehaviorSubject<any>(null);
        _placeBoundObservable = new Rx.BehaviorSubject<L.LatLngBounds>(null);
        _loadParamsObservable = new Rx.BehaviorSubject<any>(null);

        constructor(private $q:             ng.IQService,
                    private $http:          ng.IHttpService,
                    private $location:      ng.ILocationService,
                    private $timeout:       ng.ITimeoutService,
                    private $routeParams:   ng.route.IRouteParamsService) {

            this.initialize();
            this.getDateRange();
            this.loadParams();
        }

        private loadParams() {
            this._loadParamsObservable.onNext(this.$routeParams);

            this.$timeout(() => {
                this.$location.search({});
            }, 200);
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

        get placeBoundObservable():Rx.BehaviorSubject<L.LatLngBounds> {
            return this._placeBoundObservable;
        }

        get loadParamsObservable():Rx.BehaviorSubject<any> {
            return this._loadParamsObservable;
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
        }

        private getBoundOfPlace(placeString: string) {
            if (placeString) {
                var url = Configuration.getPlaceUrl(placeString);

                this.$http.get(url).then((result: any) => {
                    var place = result.data["place"];
                    var bb = place["bounding_box"];
                    var p1 = bb["coordinates"][0];
                    var p2 = bb["coordinates"][1];

                    var country_code = place["country_code"];

                    var point1 = L.latLng(p1[1], p1[0]);
                    var point2 = L.latLng(p2[1], p2[0]);
                    var bounds = L.latLngBounds(point1, point2);
                    this._placeBoundObservable.onNext(bounds);

                    this._lastPlaceCode = country_code;
                    this._lastPlaceString = placeString;
                    this._placeObservable.onNext(country_code);
                });
            } else {
                this._lastPlaceCode = null;
                this._lastPlaceString = null;
                this._placeObservable.onNext(this._lastPlaceCode);
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

        createShareLink(type: string) {
            var url = "?share";

            if (this._lastPlaceString && this._lastPlaceCode) {
                url = url + "&where=" + this._lastPlaceString;
            } else {
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
            var shortenUrl = Configuration.getShortenUrl() + "?url=" + encodeURIComponent(url);

            this.$http.get(shortenUrl).then((result: any) => {
                var tweetUrl = result.data["data"]["url"];
                this.openShare(type, tweetUrl);
            }, (data: any) => {
                this.openShare(type, url);
            });

            return url;
        }

        openShare(type: string, url: string) {
            if (type === "twitter") {
                this.twitterShare(url);
            } else if (type === "facebook") {
                this.facebookShare(url);
            }
        }

        twitterShare(url: string) {
            var params = [
                "url=" + encodeURIComponent(url),
                "via=gogeo_io",
                "hashtags=gogeo,gogeo_io,twittermap",
                "text=" + encodeURIComponent("Check out the live tweets on the map")
            ];
            var url = 'http://twitter.com/share?' + params.join("&");
            var sharePopOptions = 'height=450, width=550, top='+($(window).height()/2 - 225) +', left='+$(window).width()/2 +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0';
            window.open(url, 'twitterwindow', sharePopOptions);
        }

        facebookShare(url: string) {
            var params = [
                "app_id=873202776080901",
                "sdk=joey",
                "u=" + encodeURIComponent(url),
                "display=popup",
                "ref=plugin",
                "src=share_button"
            ];
            var url = 'https://www.facebook.com/sharer/sharer.php?' + params.join("&");
            var sharePopOptions = 'height=450, width=650, top='+($(window).height()/2 - 225) +', left='+$(window).width()/2 +', toolbar=0, location=0, menubar=0, directories=0, scrollbars=0';
            window.open(url, 'facebookwindow', sharePopOptions);
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
            this.getBoundOfPlace(place);
        }

        updateDateRange(startDate: Date, endDate: Date) {
            var dateRange: IDateRange = null;

            if (startDate || endDate) {
                dateRange = { start: startDate, end: endDate };
            }

            this._lastDateRange = dateRange;
            this._dateRangeObservable.onNext(dateRange);
        }

        updateMapCenter(mapCenter: L.LatLng) {
            this._lastMapCenter = mapCenter;
        }

        updateMapZoom(mapZoom: number) {
            this._lastMapZoom = mapZoom;
        }

        updateMapType(mapType: string) {
            this._lastMapType = mapType;
        }

        updateMapBase(mapBase: string) {
            this._lastMapBase = mapBase;
        }


        getTweet(latlng: L.LatLng, zoom: number, thematicQuery?: ThematicQuery) {
            return this.getTweetData(latlng, zoom, thematicQuery);
        }

        getDateRange() {
            if (!this.$location.search()["startDate"] && !this.$location.search()["endDate"]) {
                this.$http.get(Configuration.getDateRangeUrl()).then((result: any) => {
                    this._dateLimitObservable.onNext(result.data);
                });
            }
        }

        private getTweetData(latlng: L.LatLng, zoom: number, thematicQuery?: ThematicQuery) {
            var url = Configuration.makeUrl("geosearch/db1/" + Configuration.getCollectionName() + "?mapkey=123");
            var pixelDist = 40075 * Math.cos((latlng.lat * Math.PI / 180)) / Math.pow(2, (zoom + 8)) * 8;
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

            if (this._lastPlaceCode) {
                query.filterByPlace(this._lastPlaceCode);
            }

            if (this._lastDateRange) {
                query.filterByDateRange(this._lastDateRange);
            }

            return query;
        }
    }

    registerService(DashboardService);

}
