/// <reference path="../../_references.d.ts" />

/**
 * Created by danfma on 11/03/15.
 */


module gogeo {

    registerDirective("dashboardTagsinput", [
        () => {
            return {
                restrict: "C",

                scope: {
                    selectedTags: "="
                },

                link(scope, element: JQuery, attrs) {
                    element.tagsinput({
                        tagClass: function() {
                            console.log("args:", arguments);
                        }
                    });
                }
            };
        }
    ]);

}