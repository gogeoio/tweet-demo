/// <reference path="../../shell.ts" />


module gogeo {

    class DashboardController {
        constructor() {
            console.log("hello dashboard");
        }
    }

    registerDirective("dashboardHeader", () => {
        return {
            restrict: "C",
            templateUrl: "dashboard/controls/dashboard-header-template.html",
            controller: DashboardController,
            bindToController: true,
            scope: true
        };
    });

}