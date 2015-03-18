declare module angularytics {
  class AngularyticsProvider {
    setEventHandlers(handlers : string | Array<string>): void;
    init(): void;
  }

  class Angularytics {
    trackPageView(url: string): void;

    trackEvent(category: string): void;
    trackEvent(category: string, action: string): void;
    trackEvent(category: string, action: string, opt_label: string): void;
    trackEvent(category: string, action: string, opt_label: string, opt_value: number): void;
    trackEvent(category: string, action: string, opt_label: string, opt_value: number, opt_noninteraction: boolean): void;
  }
}