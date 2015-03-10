/// <reference path="../../shell.ts" />

/**
 * Created by danfma on 06/03/15.
 */

module gogeo {

    registerDirective("daterange",  () => {
        return {
            restrict: "E",

            template:
                `<div class="input-group daterange">
                    <input class="form-control" type="text" data-provide="datepicker" data-date-clear-btn="true"/>
                    <span class="input-group-addon">
                        <i class="glyphicon glyphicon-calendar"></i>
                    </span>
                    <input class="form-control" type="text" data-provide="datepicker" data-date-clear-btn="true"/>
                 </div>`,

            link(scope, element, attrs) {
            }
        };
    });

}
