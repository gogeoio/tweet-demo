///<reference path="./_references.d.ts"/>

module gogeo {

    var mod = angular.module("gogeo", ["ngRoute"])
        .config([
            "$routeProvider",
            ($routeProvider:ng.route.IRouteProvider) => {
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
            }
        ]);

    export interface INamed {
        $named: string;
    }

    export interface IControllerType extends Function, INamed {

    }

    export function registerController<T extends IControllerType>(controllerType: T) {
        console.info("registrando controlador: ", controllerType.$named);
        mod.controller(controllerType.$named, <Function> controllerType);
    }

    export function registerDirective(directiveName: string, config: any) {
        mod.directive(directiveName, config);
    }

}