/// <reference path="../../shell.ts" />

/**
 * Created by danfma on 06/03/15.
 */

module gogeo {


    class DashboardDetailsController {

    }


    registerDirective("dashboardDetails", () => {
        return {
            restrict: "C",
            templateUrl: "dashboard/controls/dashboard-details-template.html",
            controller: DashboardDetailsController,
            bindToController: true,
            scope: true
        };
    });

}
