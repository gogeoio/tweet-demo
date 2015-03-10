/// <reference path="../../shell.ts" />

module gogeo {

    registerDirective("dashboardPanel", () => {
        return {
            restrict: "C",

            link(scope, element, attributes) {
                function adjustSizes() {
                    var body = $(document.body);
                    var size = {
                        width: body.innerWidth(),
                        height: body.innerHeight()
                    };

                    var $top = element.find(".dashboard-top-panel");
                    var $center = element.find(".dashboard-center-panel");

                    $top.height($top.attr("data-height") + "px");
                    $center.height(size.height - $top.height());
                }

                $(window).on("resize", adjustSizes);
                adjustSizes(); // forcing the first resize

                scope.$on("destroy", () => {
                    $(window).off("resize", adjustSizes);
                });
            }
        };
    });

}
