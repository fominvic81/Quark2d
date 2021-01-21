import { Sleeping } from '../body/Sleeping';
import { Composite } from './Composite';


export class World extends Composite {

    constructor () {
        super();
        this.sleepingBodies = new Map();
        this.staticBodies = new Map();
        this.activeBodies = new Map();
        this.eventIds = new Map();
    }

    addBody (bodies) {
        super.addBody(bodies);
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {

            if (body.isStatic) {
                this.staticBodies.set(body.id, body);
            } else if (body.sleepState === Sleeping.SLEEPING) {
                this.sleepingBodies.set(body.id, body);
            } else {
                this.activeBodies.set(body.id, body);
            }

            const sleepStartId = body.events.on('sleep-start', () => {
                this.activeBodies.delete(body.id);
                this.sleepingBodies.set(body.id, body);
            });
            const sleepEndId = body.events.on('sleep-end', () => {
                this.sleepingBodies.delete(body.id);
                this.activeBodies.set(body.id, body);
            });
            const becomeStaticId = body.events.on('become-static', () => {
                this.activeBodies.delete(body.id);
                this.sleepingBodies.delete(body.id);
                this.staticBodies.set(body.id, body);
            });
            const becomeDynamicId = body.events.on('become-dynamic', () => {
                this.staticBodies.delete(body.id);
                this.activeBodies.set(body.id, body);
            });
            this.eventIds.set(body.id, [sleepStartId, sleepEndId, becomeStaticId, becomeDynamicId]);
        }
    }

    removeBody (bodies) {
        super.removeBody(bodies);
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {
            this.staticBodies.delete(body.id);
            this.sleepingBodies.delete(body.id);
            this.activeBodies.delete(body.id);

            for (const eventId of this.eventIds.get(body.id)) {
                body.events.off(eventId);
            }
        }
    }

    getActiveBodies () {
        return [...this.activeBodies.values()];
    }

    getSleepingBodies () {
        return [...this.sleepingBodies.values()];
    }

    getStaticBodies () {
        return [...this.staticBodies.values()];
    }

}