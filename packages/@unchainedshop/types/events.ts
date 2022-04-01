import { FindOptions, ModuleCreateMutation, Query, Sort, TimestampFields, _ID } from './common';

export type EventPayload = {
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

export type Event = {
  _id?: _ID;
  type: string;
} & EventPayload &
  TimestampFields;

export interface EmitAdapter {
  publish(eventName: string, data: EventPayload): void;
  subscribe(eventName: string, callback: (payload?: Record<string, unknown>) => void): void;
}
export type ContextNormalizerFunction = (context: any) => any;

export interface EventDirector {
  emit: (eventName: string, data?: string | Record<string, unknown>) => Promise<void>;
  getEmitAdapter: () => EmitAdapter;
  getEmitHistoryAdapter: () => EmitAdapter;
  getRegisteredEvents: () => string[];
  registerEvents: (events: string[]) => void;
  setContextNormalizer: (fn: ContextNormalizerFunction) => void;
  setEmitAdapter: (adapter: EmitAdapter) => void;
  setEmitHistoryAdapter: (adapter: EmitAdapter) => void;
  subscribe: (eventName: string, callback: (payload?: Record<string, unknown>) => void) => void;
}

export interface EventsModule extends ModuleCreateMutation<Event> {
  findEvent: (params: Query & { eventId: _ID }, options?: FindOptions) => Promise<Event>;

  findEvents: (
    params: Query & {
      limit?: number;
      offset?: number;
      sort?: Sort;
    },
    options?: FindOptions,
  ) => Promise<Array<Event>>;

  type: (event: Event) => string;

  count: (query: Query) => Promise<number>;
}
