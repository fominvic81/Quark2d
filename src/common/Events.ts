import { Common } from './Common';

/**
 * The 'Events' is the class for manipulating events.
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
 *     events.off(eventId);
 * 
 *     events.trigger('test', [3, 4, {str: 'another string'}]); // console:    (nothing)
 * 
 */

export class Events {
    private events: Map<string, Map<number, {(...args: any[]): void}>> = new Map();
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
        const event = this.events.get(name);
        if (!event) return;
        for (const callback of event.values()) {
            callback(...args);
        }
    }

    /**
     * Clears all events.
     */
    clear () {
        this.events.clear();
        this.namesByIds.clear();
    }

}