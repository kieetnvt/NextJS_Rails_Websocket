declare module '@rails/actioncable' {
  export interface Consumer {
    subscriptions: {
      create: (channelName: { channel: string }, callbacks: ChannelCallbacks) => Subscription;
    };
    disconnect(): void;
  }

  export interface Subscription {
    unsubscribe(): void;
  }

  export interface ChannelCallbacks {
    connected?(): void;
    disconnected?(): void;
    received?(data: unknown): void;
  }

  export function createConsumer(url?: string): Consumer;
}
