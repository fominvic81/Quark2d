import { SleepingState } from '../body/Sleeping';
import { Composite } from './Composite';

/**
 * The 'World'(extends 'Composite') is container for bodies and constraints. The 'World' provides some addition optimizations for sleeping and static bodies.
 */

export class World extends Composite {
    sleepingBodies: Map<number, any> = new Map(); // TODO-types
    staticBodies: Map<number, any> = new Map(); // TODO-types
    activeBodies: Map<number, any> = new Map(); // TODO-types
    private eventIds: Map<number, Array<number>> = new Map();

    /**
     * Adds given objects to the world.
     * @param objects
     */
    addBody (bodies: Array<any>) { // TODO-types
        super.addBody(bodies);
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {

            if (body.isStatic) {
                this.staticBodies.set(body.id, body);
            } else if (body.sleepState === SleepingState.SLEEPING) {
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

    /**
     * Removes the given bodies from the world.
     * @param bodies
     */
    removeBody (bodies: Array<any>) { // TODO-types
        super.removeBody(bodies);
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {
            this.staticBodies.delete(body.id);
            this.sleepingBodies.delete(body.id);
            this.activeBodies.delete(body.id);

            for (const eventId of <Array<number>>this.eventIds.get(body.id)) {
                body.events.off(eventId);
            }
        }
    }

    /**
     * @returns All active bodies that exists in the world.
     */
    getActiveBodies () {
        return [...this.activeBodies.values()];
    }
    
    /**
     * @returns All sleeping bodies that exists in the world.
     */
    getSleepingBodies () {
        return [...this.sleepingBodies.values()];
    }
    
    /**
     * @returns All static bodies that exists in the world.
     */
    getStaticBodies () {
        return [...this.staticBodies.values()];
    }

}