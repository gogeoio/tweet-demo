/// <reference path="../../shell.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />

module gogeo {

    class DashboardController {
        static $inject = [
            "$scope",
            DashboardService.$named
        ];

        term:string;

        constructor(private $scope:ng.IScope,
                    private service:DashboardService) {
            this.initialize();
        }

        initialize() {
            this.$scope.$watch("header.term", (term: string) => {
                this.service.updateSearchTerm(term);
            });
        }
    }

    registerDirective("dashboardHeader", () => {
        return {
            restrict: "C",
            templateUrl: "dashboard/controls/dashboard-header-template.html",
            controller: DashboardController,
            controllerAs: "header",
            bindToController: true,
            scope: true
        };
    });

}