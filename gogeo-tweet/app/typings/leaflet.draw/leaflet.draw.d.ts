/// <reference path="../leaflet/leaflet.d.ts"/>

declare module L {
  export interface ControlStatic extends L.ClassStatic {
    Draw: Draw;
  }

  export interface Draw extends L.Control {
    new(options?: any);

    setPosition(position: string): Control;

    getPosition(): string;

    addTo(map: Map): Control;

    removeFrom(map: Map): Control;

    getContainer(): HTMLElement;

    onAdd(map: Map): HTMLElement;

    onRemove(map: Map): void;
  }
}