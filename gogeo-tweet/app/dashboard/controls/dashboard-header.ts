/// <reference path="../../shell.ts" />
/// <reference path="../../shared/abstract-controller.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />

module gogeo {

    class DashboardController extends AbstractController {
        static $inject = [
            "$scope",
            DashboardService.$named
        ];

        somethingTerm: string;
        place: string;
        startDate: string = null;
        endDate: string = null;
        dateFormat: string = "MM/DD/YYYY";

        constructor($scope:ng.IScope,
                    private dashboardService:DashboardService) {
            super($scope);

            this.startDate = moment().subtract(7, "days").format(this.dateFormat);
            this.endDate = moment().format(this.dateFormat);

            this.initialize();
        }

        initialize() {
            super.initialize();

            this.watchAsObservable<string>("somethingTerm")
                .skip(1)
                .throttle(800)
                .select(term => {
                    return Enumerable
                        .from(term.split(" "))
                        .select(part => part.trim())
                        .toArray();
                })
                .subscribe(terms => this.dashboardService.updateSomethingTerms(terms));

            this.watchAsObservable<string>("place")
                .skip(1)
                .throttle(800)
                .subscribe(place => this.dashboardService.updatePlace(place));

            Rx.Observable.merge(this.watchAsObservable<string>("startDate"), this.watchAsObservable<string>("endDate"))
                .skip(1)
                .throttle(400)
                .subscribe(range => {
                    var startDate: Date = null;
                    var endDate: Date = null;

                    if (this.startDate) {
                        startDate = new Date(Date.parse(this.startDate));
                    }

                    if (this.endDate) {
                        endDate = new Date(Date.parse(this.endDate));
                    }

                    this.dashboardService.updateDateRange(startDate, endDate);
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