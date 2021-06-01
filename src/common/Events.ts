import { Common } from './Common';

/**
 * The 'Events' is the class for creating event listeners.
 * 
 * @example:
 * 
 *     const events = new Events();
 * 
 * 
 *     const eventId = events.on('test', (arg1, arg2, arg3) => {
 * 
 *         console.log(arg1, arg2, arg3);
 * 
 *     });
 * 
 * 
 *     events.trigger('test', [1, 2, {srt: 'string'}]); // console: 1 2 {srt: "string"}
 * 
 */

export class Events {
    private events: Map<string, Map<number, {(...args: any[]): void}>> = new Map();
    private onceEvents: Map<string, Set<{(...args: any[]): void}>> = new Map();
    private namesByIds: Map<number, Array<string | number>> = new Map();

    /**
     * Subscribes the callback function to the given event name.
     * @param name
     * @param callback
     * @returns The id of the event
     */
    on (name: string, callback: {(...args: any[]): void}): number {
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
    once (name: string, callback: {(...args: any[]): void}) {
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
     * @param args
     */
    trigger (name: string, args: any[] = []) {
        const callbacks = this.events.get(name);
        if (callbacks) for (const callback of callbacks.values()) {
            callback(...args);
        }
        const onces = this.onceEvents.get(name);
        if (onces) for (const callback of onces.values()) {
            callback(...args);
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