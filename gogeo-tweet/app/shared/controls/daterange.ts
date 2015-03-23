/// <reference path="../../shell.ts" />
/// <reference path="../../dashboard/services/dashboard-service.ts" />

/**
 * Created by danfma on 06/03/15.
 */

module gogeo {

    class DataRangeController {
        static $inject = [
            "$scope",
            DashboardService.$named
        ];

        min: string = null;
        max: string = null;

        constructor(
            private $scope: ng.IScope,
            private service: DashboardService) {
        }

        initialize() {
            this.service.dateLimitObservable
                .subscribeAndApply(this.$scope, (result: any) => {
                    if (result) {
                        this.min = moment(new Date(result["min"])).format("MM/DD/YYYY");
                        this.max = moment(new Date(result["max"])).format("MM/DD/YYYY");
                    }
            });
        }
    }

    registerDirective("daterange",  () => {
        return {
            restrict: "E",
            template: `
                <div class="input-group daterange">
                    <input 
                        id="startRange"
                        class="form-control"
                        type="text"
                        data-provide="datepicker"
                        data-date-clear-btn="true"
                        data-date-start-date="{{range.min}}"
                        data-date-end-date="{{range.max}}"
                        data-date-autoclose="true"
                        ng-model="startDate"/>
                    <span class="input-group-addon">
                        <i class="glyphicon glyphicon-calendar"></i>
                    </span>
                    <input
                        id="endRange"
                        class="form-control"
                        type="text"
                        data-provide="datepicker"
                        data-date-clear-btn="true"
                        data-date-start-date="{{range.min}}"
                        data-date-end-date="{{range.max}}"
                        data-date-autoclose="true"
                        ng-model="endDate"/>
                </div>`,

            scope: {
                startDate: "=",
                endDate: "="
            },

            controller: DataRangeController,
            controllerAs: "range",

            link(scope, element, attrs, controller: DataRangeController) {
                controller.initialize();
            }
        };
    });

}
