import { Common } from './Common';

export class Events {

    constructor () {
        this.events = new Map();
        this.namesByIds = new Map();
    }

    on (name, callback) {
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

    off (id) {
        const a = this.namesByIds.get(id);
        if (!a) return false;

        const name = a[0];
        const callbackId = a[1];

        return this.events.get(name).delete(callbackId);
    }

    trigger (name, args = []) {
        const event = this.events.get(name);
        if (!event) return;
        for (const callback of event.values()) {
            callback(...args);
        }
    }

}