/// <reference path="../leaflet/leaflet.d.ts"/>

/**
 * Created by danfma on 07/03/15.
 */

declare module L {

    export class Google implements L.ILayer {
        constructor(name: string, options?: any);
        onAdd(map:L.Map):void;
        onRemove(map:L.Map):void;
    }

}
