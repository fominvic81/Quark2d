

export class Events {

    constructor () {
        this.events = new Map();
    }

    on (name, callback) {
        if (!this.events.get(name)) {
            this.events.set(name, []);
        }
        this.events.get(name).push(callback);
    }

    trigger (name, args = []) {
        const event = this.events.get(name);
        if (!event) return;
        for (const callback of event) {
            callback(...args);
        }
    }

}