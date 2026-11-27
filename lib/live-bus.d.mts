export type LiveBusListener = (message: unknown) => void;

export type LiveBus = {
  listeners: Set<LiveBusListener>;
};

export declare function getLiveBus(): LiveBus;
