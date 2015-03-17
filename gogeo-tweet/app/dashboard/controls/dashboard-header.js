/// <reference path="../../shell.ts" />
/// <reference path="../../shared/abstract-controller.ts" />
/// <reference path="../services/dashboard-events.ts" />
/// <reference path="../services/dashboard-service.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var gogeo;
(function (gogeo) {
    var DashboardController = (function (_super) {
        __extends(DashboardController, _super);
        function DashboardController($scope, dashboardService) {
            _super.call(this, $scope);
            this.dashboardService = dashboardService;
            this.initialize();
        }
        DashboardController.prototype.initialize = function () {
            var _this = this;
            _super.prototype.initialize.call(this);
            this.watchAsObservable("somethingTerm").skip(1).throttle(400).select(function (term) {
                return Enumerable.from(term.split(" ")).select(function (part) { return part.trim(); }).toArray();
            }).subscribe(function (terms) { return _this.dashboardService.updateSomethingTerms(terms); });
            this.watchAsObservable("place").skip(1).throttle(400).subscribe(function (place) { return _this.dashboardService.updatePlace(place); });
            Rx.Observable.merge(this.watchAsObservable("startDate"), this.watchAsObservable("endDate")).skip(1).throttle(400).subscribe(function (range) {
                var startDate = null;
                var endDate = null;
                if (_this.startDate)
                    startDate = new Date(Date.parse(_this.startDate));
                if (_this.endDate)
                    endDate = new Date(Date.parse(_this.endDate));
                _this.dashboardService.updateDateRange(startDate, endDate);
            });
        };
        DashboardController.$inject = [
            "$scope",
            gogeo.DashboardService.$named
        ];
        return DashboardController;
    })(gogeo.AbstractController);
    gogeo.registerDirective("dashboardHeader", function () {
        return {
            restrict: "C",
            templateUrl: "dashboard/controls/dashboard-header-template.html",
            controller: DashboardController,
            controllerAs: "header",
            bindToController: true,
            scope: true
        };
    });
})(gogeo || (gogeo = {}));
//# sourceMappingURL=dashboard-header.js.map