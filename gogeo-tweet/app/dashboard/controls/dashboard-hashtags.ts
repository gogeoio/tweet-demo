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

        constructor(
            private $scope: ng.IScope,
            private service: DashboardService) {

        }

        hasSelected() {
            return this.selectedHashtag != null;
        }

        selectHashtag(bucket: IBucket) {
            this.selectedHashtag = bucket;
            this.service.updateHashtagBucket(bucket);
        }

        unselect() {
            this.selectedHashtag = null;
            this.service.updateHashtagBucket(null);
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
