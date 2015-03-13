/// <reference path="../leaflet/leaflet.d.ts"/>

declare module L {

  export class TileCluster implements L.ILayer {
    constructor(url: string, options: any);
    onAdd(map:L.Map):void;
    onRemove(map:L.Map):void;
  }

}