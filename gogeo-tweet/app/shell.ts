///<reference path="./_references.d.ts"/>

module gogeo {

    var mod = angular.module("gogeo", ["ngRoute", "angularytics"])
        .config([
            "$routeProvider",
            "AngularyticsProvider",
            ($routeProvider: ng.route.IRouteProvider, AngularyticsProvider: any) => {
                $routeProvider
                    .when("/welcome", {
                        controller: "WelcomeController",
                        controllerAs: "welcome",
                        templateUrl: "welcome/page.html"
                    })
                    .when("/dashboard", {
                        controller: "DashboardController",
                        controllerAs: "dashboard",
                        templateUrl: "dashboard/page.html"
                    })
                    .otherwise({
                        redirectTo: "/welcome"
                    });
                if (window.location.hostname.match("gogeo.io")) {
                    AngularyticsProvider.setEventHandlers(["Google"]);
                } else {
                    AngularyticsProvider.setEventHandlers(["Console"]);
                }
            }
        ]).run(function(Angularytics) {
            Angularytics.init();
          });

    export interface INamed {
        $named: string;
    }

    export interface INamedType extends Function, INamed {

    }

    export function registerController<T extends INamedType>(controllerType: T) {
        mod.controller(controllerType.$named, <Function> controllerType);
    }

    export function registerService<T extends INamedType>(serviceType: T) {
        mod.service(serviceType.$named, serviceType);
    }

    export function registerDirective(directiveName: string, config: any) {
        mod.directive(directiveName, config);
    }

    export function registerFilter(filterName: string, filter: (any) => string) {
        mod.filter(filterName, () => filter);
    }

}