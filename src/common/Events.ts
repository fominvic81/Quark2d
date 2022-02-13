import { Common } from './Common';

export type Callback = (...data: any[]) => void;
export type DefaultEventMap = {[name: string]: Callback};

/**
 * The 'Events' is the class for creating event listeners.
 * 
 * @example:
 * 
 *     const events = new Events();
 * 
 * 
 *     const eventId = events.on('test', (data) => {
 * 
 *         console.log(data);
 * 
 *     });
 * 
 * 
 *     events.trigger('test', [1, 2, {str: 'string'}]);
 * 
 */


export class Events<EventMap extends DefaultEventMap = DefaultEventMap> {
    private events: Map<keyof EventMap, Map<number, Callback>> = new Map();
    private onceEvents: Map<keyof EventMap, Set<Callback>> = new Map();
    private namesByIds: Map<number, Array<keyof EventMap | number>> = new Map();

    /**
     * Subscribes the callback function to the given event name.
     * @param name
     * @param callback
     * @returns The id of the event
     */
    on = <U extends keyof EventMap>(name: U, callback: EventMap[U]): number => {
        const id = Common.nextId();
        const callbackId = Common.nextId();

        this.namesByIds.set(id, [name, callbackId]);

        let a = this.events.get(name);
        if (!a) {
            a = new Map();
            this.events.set(name, a);
        }
        a.set(callbackId, callback);

        return id;
    }

    /**
     * Subscribes the callback function to the given event name for one time.
     * @param name
     * @param callback
     */
    once = <U extends keyof EventMap>(name: U, callback: EventMap[U]) => {
        let a = this.onceEvents.get(name);
        if (!a) {
            a = new Set();
            this.onceEvents.set(name, a);
        }
        a.add(callback);
    }

    /**
     * Unsubscribes the callback function from the given event name.
     * @param id
     * @returns True if the event was successfully unsubscribed, otherwise false
     */
    off (id: number): boolean {
        const a = this.namesByIds.get(id);
        if (!a) return false;

        const name = <string>a[0];
        const callbackId = <number>a[1];

        return <boolean>this.events.get(name)?.delete(callbackId);
    }

    /**
     * Triggers all the callbacks subscribed to the given name.
     * @param name
     * @param data
     */
    trigger = <U extends keyof EventMap>(name: U, ...data: Parameters<EventMap[U]>) => {
        const callbacks = this.events.get(name);
        if (callbacks) for (const callback of callbacks.values()) {
            callback(...data);
        }
        const onces = this.onceEvents.get(name);
        if (onces) for (const callback of onces.values()) {
            callback(...data);
        }
        this.onceEvents.delete(name);
    }

    /**
     * Clears all events.
     */
    clear () {
        this.events.clear();
        this.namesByIds.clear();
    }

}