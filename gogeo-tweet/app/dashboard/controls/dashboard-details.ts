/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />

module gogeo {

    class DashboardDetailsController {
        static $inject = [
            "$scope",
            "$interval",
            "$filter",
            DashboardService.$named
        ];

        hashtagResult: IHashtagResult = null;
        selectedHashtag: IBucket = null;
        currentMax: number = 0;
        totalTweets: number = 0;
        bucketSize: number = 0;
        currentInterval: any = null;
        updateInterval: number = 30000; // milliseconds
        updateWindow: number = 100;

        constructor(private $scope: ng.IScope,
                    private $interval: ng.IIntervalService,
                    private $filter: ng.IFilterService,
                    private service: DashboardService) {
        }

        initialize() {
            this.service.hashtagResultObservable
                .subscribeAndApply(this.$scope, result => this.handleResult(result));

            this.updateTotal();

            this.$interval(() => {
                if (this.currentInterval) {
                    this.$interval.cancel(this.currentInterval);
                }
                this.updateTotal();
            }, this.updateInterval);
        }

        startTotalInterval() {
            this.currentInterval = this.$interval(() => {
                if (this.totalTweets < this.currentMax) {
                    var factor = this.updateWindow * this.bucketSize;
                    var updateSize = Math.floor(factor / this.updateInterval);
                    this.totalTweets = this.totalTweets + updateSize;
                }
            }, this.updateWindow);
        }

        updateTotal() {
            this.service.totalTweets().then((result: any) => {
                this.totalTweets = parseInt(result["data"]["total"]);
                this.bucketSize = parseInt(result["data"]["read"]);
                this.currentMax = this.totalTweets + this.bucketSize;
                this.startTotalInterval();
            });
        }

        handleResult(result : IHashtagResult) {
            this.hashtagResult = result;
            if (this.selectedHashtag) {
                this.selectedHashtag.doc_count = result.doc_total;
            }
        }

        unselect() {
            this.selectedHashtag = null;
            this.service.updateHashtagBucket(null);
        }
    }

    registerDirective("dashboardDetails", () => {
        return {
            restrict: "CE",
            templateUrl: "dashboard/controls/dashboard-details-template.html",
            controller: DashboardDetailsController,
            controllerAs: "details",
            bindToController: true,
            scope: true,

            link(scope, element, attrs, controller:DashboardDetailsController) {
                controller.initialize();
            }
        };
    });
}