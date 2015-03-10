/**
 * Created by danfma on 07/03/15.
 */

module gogeo {

    function prefix(eventName: string) {
        return `gogeo:${eventName}`;
    }

    export class DashboardEvent {
        static mapLoaded = prefix("dashboard:mapLoaded");
    }

}
