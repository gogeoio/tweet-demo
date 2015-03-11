declare module angularytics {
  class AngularyticsProvider {
    setEventHandlers(handlers : string | Array<string>): void;
    init(): void;
  }
}