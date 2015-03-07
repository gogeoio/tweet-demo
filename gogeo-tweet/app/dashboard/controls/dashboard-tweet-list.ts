/// <reference path="../../shell.ts" />

/**
 * Created by danfma on 06/03/15.
 */

module gogeo {

    registerDirective("dashboardTweetList", () => {
        return {
            restrict: "E",
            templateUrl: "dashboard/controls/dashboard-tweet-list-template.html"
        };
    });

}
