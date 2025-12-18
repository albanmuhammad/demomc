export {};

declare global {
  type McxSubscriberData = {
    ID: string;
    SubscriberKey: string;
  };

  type McxInitOptions = {
    data: McxSubscriberData;
  };

  interface McxPush {
    initialize(options: McxInitOptions): void;
    showNotificationPrompt(options: McxInitOptions): void;
    subscribe(options: McxInitOptions): void;
    showPWAInstallPrompt(): void;
  }

  interface Window {
    mcxPush?: McxPush;
  }
}
