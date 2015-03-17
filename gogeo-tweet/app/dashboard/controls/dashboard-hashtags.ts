/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />

/**
 * Created by danfma on 06/03/15.
 */

module gogeo {

    export class DashboardHashtagsController {
        static $inject = [
            "$scope",
            DashboardService.$named
        ];

        buckets: Array<IBucket> = [];
        selectedHashtag: IBucket = null;
        message: string = null;

        constructor(
            private $scope: ng.IScope,
            private service: DashboardService) {

            this.message = "Top 10 hashtags";

            this.service.hashtagResultObservable
                .subscribeAndApply(this.$scope, (result) => {
                    if (result && result["buckets_qtd"] == 10) {
                        this.message = "Top 10 hashtags";
                    }
                });
        }

        hasSelected() {
            return this.selectedHashtag != null;
        }

        selectHashtag(bucket: IBucket) {
            this.message = "Top 5 places for this hashtag";
            this.selectedHashtag = bucket;
            this.service.updateHashtagBucket(bucket);
        }
    }

    registerDirective("dashboardHashtags", () => {
        return {
            restrict: "E",
            templateUrl: "dashboard/controls/dashboard-hashtags-template.html",
            controller: DashboardHashtagsController,
            controllerAs: "hashtags",
            bindToController: true,

            scope: {
                buckets: "=",
                selectedHashtag: "="
            },

            link(scope, element, attrs, controller:DashboardHashtagsController) {

            }
        };
    });

}
