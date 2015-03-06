///<reference path="./_references.d.ts"/>
var gogeo;
(function (gogeo) {
    var mod = angular.module("gogeo", ["ngRoute"]).config([
        "$routeProvider",
        function ($routeProvider) {
            $routeProvider.when("/welcome", {
                controller: "WelcomeController",
                controllerAs: "welcome",
                templateUrl: "welcome/page.html"
            }).when("/dashboard", {
                controller: "DashboardController",
                controllerAs: "dashboard",
                templateUrl: "dashboard/page.html"
            }).otherwise({
                redirectTo: "/welcome"
            });
        }
    ]);
    function registerController(controllerType) {
        console.info("registrando controlador: ", controllerType.$named);
        mod.controller(controllerType.$named, controllerType);
    }
    gogeo.registerController = registerController;
})(gogeo || (gogeo = {}));
/// <reference path="../shell.ts"/>
/**
 * Created by danfma on 05/03/15.
 */
var gogeo;
(function (gogeo) {
    var DashboardController = (function () {
        function DashboardController() {
            this.hello = "thu";
        }
        DashboardController.$named = "DashboardController";
        return DashboardController;
    })();
    gogeo.DashboardController = DashboardController;
    gogeo.registerController(DashboardController);
})(gogeo || (gogeo = {}));
/// <reference path="../shell.ts"/>
/**
 * Created by danfma on 05/03/15.
 */
var gogeo;
(function (gogeo) {
    var WelcomeController = (function () {
        function WelcomeController() {
        }
        WelcomeController.$named = "WelcomeController";
        return WelcomeController;
    })();
    gogeo.WelcomeController = WelcomeController;
    gogeo.registerController(WelcomeController);
})(gogeo || (gogeo = {}));
/// <reference path="../../shell.ts" />
/**
 * Created by danfma on 05/03/15.
 */
var gogeo;
(function (gogeo) {
    angular.module("gogeo").directive("welcomeMap", [
        function () {
            return {
                restrict: "C",
                template: "<div>Testando!</div>",
                link: function (scope, element, attrs) {
                    var rawElement = element[0];
                    var accessToken = "pk.eyJ1IjoibG9raWRnIiwiYSI6IkRfNkpoMHcifQ.m4reSWIhrD5xIJVkrhRAxA";
                    L.mapbox.accessToken = accessToken;
                    var initialPos = L.latLng(-11.372, -57.634);
                    var map = L.mapbox.map(rawElement, "lokidg.i7gg619k").setView(initialPos, 5);
                    scope.$on("destroy", function () { return map.remove(); });
                }
            };
        }
    ]);
})(gogeo || (gogeo = {}));
