import { Body, BodyType } from '../body/Body';
import { SleepingState } from '../body/Sleeping';
import { Engine } from '../engine/Engine';
import { Composite } from './Composite';

/**
 * The 'World'(extends 'Composite') is container for bodies and constraints. The 'World' provides some addition optimizations for sleeping and static bodies.
 */

export class World extends Composite {
    sleepingBodies: Map<number, Body> = new Map();
    staticBodies: Map<number, Body> = new Map();
    kinematicBodies: Map<number, Body> = new Map();
    activeBodies: Map<number, Body> = new Map();
    private eventIds: Map<number, number[]> = new Map();
    engine: Engine;

    constructor (engine: Engine) {
        super();

        this.engine = engine;
    }

    /**
     * Adds given objects to the world.
     * @param objects
     */
    addBody (...bodies: Body[]) {
        super.addBody(...bodies);

        for (const body of bodies) {
            body.engine = this.engine;

            if (body.type === BodyType.dynamic) {
                if (body.sleepState === SleepingState.SLEEPING) {
                    this.sleepingBodies.set(body.id, body);
                } else {
                    this.activeBodies.set(body.id, body);
                }
            } else if (body.type === BodyType.static) {
                this.staticBodies.set(body.id, body);
            } else if (body.type === BodyType.kinematic) {
                this.kinematicBodies.set(body.id, body);
            }

            const sleepStartId = body.events.on('sleep-start', () => {
                this.activeBodies.delete(body.id);
                this.sleepingBodies.set(body.id, body);
            });
            const sleepEndId = body.events.on('sleep-end', () => {
                this.sleepingBodies.delete(body.id);
                this.activeBodies.set(body.id, body);
            });
            const becomeDynamicId = body.events.on('become-dynamic', (event) => {
                if (event.previousType === BodyType.static) {
                    this.staticBodies.delete(body.id);
                } else if (event.previousType === BodyType.kinematic) {
                    this.kinematicBodies.delete(body.id);
                }

                this.activeBodies.set(body.id, body);
            });
            const becomeStaticId = body.events.on('become-static', (event) => {
                if (event.previousType === BodyType.dynamic) {
                    if (body.sleepState === SleepingState.SLEEPING) {
                        this.sleepingBodies.delete(body.id);
                    } else {
                        this.activeBodies.delete(body.id);
                    }
                } else if (event.previousType === BodyType.kinematic) {
                    this.kinematicBodies.delete(body.id);
                }

                this.staticBodies.set(body.id, body);
            });
            const becomeKinematicId = body.events.on('become-kinematic', (event) => {
                if (event.previousType === BodyType.dynamic) {
                    if (body.sleepState === SleepingState.SLEEPING) {
                        this.sleepingBodies.delete(body.id);
                    } else {
                        this.activeBodies.delete(body.id);
                    }
                } else if (event.previousType === BodyType.static) {
                    this.staticBodies.delete(body.id);
                }

                this.kinematicBodies.set(body.id, body);
            });
            this.eventIds.set(body.id, [sleepStartId, sleepEndId, becomeDynamicId, becomeStaticId, becomeKinematicId]);
        }
    }

    /**
     * Removes the given bodies from the world(after removing body from world you must call engine.removeBody()).
     * @param bodies
     */
    removeBody (...bodies: Body[]) {
        super.removeBody(...bodies);
        this.engine.removeBody(...bodies);

        for (const body of bodies) {
            body.engine = undefined;

            if (body.type === BodyType.dynamic) {
                if (body.sleepState === SleepingState.SLEEPING) {
                    this.sleepingBodies.delete(body.id);
                } else {
                    this.activeBodies.delete(body.id);
                }
            } else if (body.type === BodyType.static) {
                this.staticBodies.delete(body.id);
            } else if (body.type === BodyType.kinematic) {
                this.kinematicBodies.delete(body.id);
            }

            for (const eventId of <number[]>this.eventIds.get(body.id)) {
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