/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-service.ts" />

module gogeo {

  export class MetricsService {
    static $named = "metricsService";

    static $inject = [
      "$rootScope",
      "$location",
      "Angularytics",
      "dashboardService"
    ];

    private _lastGeom: IGeomSpace = null;
    private _lastBucketResult: IBucket = null;
    private _lastTerms: Array<string> = null;
    private _lastDateRange: IDateRange = null;
    private _lastPlace: string = null;

    constructor(private $scope: ng.IScope,
                private $location: ng.ILocationService,
                private angularytics: angularytics.Angularytics,
                private service: DashboardService) {

      this.initialize();

      if (this.$location.host().match("gogeo.io")) {
        this.angularytics.trackPageView("/");
      }
    }

    initialize() {

      this.service.geomSpaceObservable
        .subscribeAndApply(this.$scope, geom => this.publishGeomMetric(geom));

      this.service.hashtagFilterObservable
        .subscribeAndApply(this.$scope, bucketResult => this.publishHashtagMetric(bucketResult));

      this.service.somethingTermsObservable
        .subscribeAndApply(this.$scope, (terms) => this.publishWhatMetric(terms));

      this.service.dateRangeObsersable
        .subscribeAndApply(this.$scope, (dateRange) => this.publishWhenMetric(dateRange));

      this.service.placeObservable
        .subscribeAndApply(this.$scope, (place) => this.publishWhereMetric(place));

      this.service.tweetObservable
        .subscribeAndApply(this.$scope, (tweet) => {
          this.publishPopupMetric(tweet);
        });
    }

    publishGeomMetric(geom: IGeomSpace) {
      this._lastGeom = geom;

      if (geom && geom.source === "draw") {
        this.publishMetric("geom", "geom", "geom");
      }
    }

    publishHashtagMetric(bucketResult: IBucket) {
      this._lastBucketResult = bucketResult;

      if (!bucketResult) {
        return;
      }
      this.publishMetric("hashtag", "click", bucketResult.key);
    }

    publishWhereMetric(place: string) {
      this._lastPlace = place;

      if (this.validateParam(place)) {
        this.publishMetric("where", "where", place);
      }
    }

    publishWhatMetric(terms: Array<string>) {
      this._lastTerms = terms;

      if (this.validateParam(terms)) {
        this.publishMetric("query", "query", terms.join(" "));
      }
    }

    publishWhenMetric(dateRange: IDateRange) {
      this._lastDateRange = dateRange;

      if (!dateRange) {
        return;
      }

      var label = this.getDateLabel(dateRange);
      this.publishMetric("when", "when", label);
    }

    publishThematicMetric(selectedLayers: Array<String>) {
      this.publishMetric("thematic", "thematic", selectedLayers.join(" "));
    }

    publishMapTypeMetric(type: string) {
      this.publishMetric("mapType", "mapType", type);
    }

    publishPopupMetric(tweet: ITweet) {
      if (!tweet) {
        return;
      }

      var labels = [];

      if (this._lastBucketResult) {
        labels.push("hashtag: " + this._lastBucketResult.key);
      }

      if (this.validateParam(this._lastTerms)) {
        labels.push("what: " + this._lastTerms.join(" "));
      }

      if (this._lastDateRange) {
        labels.push("when: " + this.getDateLabel(this._lastDateRange));
      }

      if (this._lastPlace) {
        labels.push("where: " + this._lastPlace);
      }

      this.publishMetric("popup", "popup", labels.join(" | "));
    }

    publishSwitchBaseLayer(baseLayer: string) {
      this.publishMetric("baseLayer", "baseLayer", baseLayer);
    }

    private publishMetric(action: string, category?: string, label?: string) {
      if (this.$location.host().match("gogeo.io")) {
        this.angularytics.trackEvent(action, category, label);
      } else {
        console.debug("publish metric", action, "category:", category, "label:", label);
      }
    }

    private validateParam(param: any): boolean {
      return param && param.length > 0;
    }

    private getDateLabel(dateRange: IDateRange): string {
      var label = "";
      if (dateRange.start) {
        label = "start: " + moment(dateRange.start).format("YYYY-MM-DD");
      }

      if (dateRange.end) {
        label = label + " end: " + moment(dateRange.end).format("YYYY-MM-DD");
      }

      return label;
    }
  }

  registerService(MetricsService);
}