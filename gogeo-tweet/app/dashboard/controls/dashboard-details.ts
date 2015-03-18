/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />

module gogeo {

    class DashboardDetailsController {
        static $inject = [
            "$scope",
            DashboardService.$named
        ];

        hashtagResult: IHashtagResult = null;
        selectedHashtag: IBucket = null;

        constructor(private $scope: ng.IScope,
                    private service: DashboardService) {
        }

        initialize() {
            this.service.hashtagResultObservable
                .subscribeAndApply(this.$scope, result => this.handleResult(result));
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