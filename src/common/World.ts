import { Body, BodyType } from '../body/Body';
import { Engine } from '../engine/Engine';
import { Joint } from '../joint/Joint';
import { Events } from './Events';

/**
 * The world is container for bodies and joints.
 * 
 * Events:
 * * add-body
 * * remove-body
 * * add-joint
 * * remove-joint
 */

export class World extends Events {
    bodies: Map<number, Body> = new Map();
    joints: Map<number, Joint> = new Map();
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
     add (...objects: Array<Body | Joint>) {
        for (const object of objects) {
            if (object instanceof Body) {
                this.addBody(object);
            } else if (object instanceof Joint) {
                this.addJoint(object);
            }
        }
        return objects;
    }

    /**
     * Adds given objects to the world.
     * @param objects
     */
    addBody (...bodies: Body[]) {

        for (const body of bodies) {
            this.trigger('add-body', [{body}]);
            this.bodies.set(body.id, body);

            body.engine = this.engine;
            this.engine.manager.aabbTree.addBody(body);

            if (body.type === BodyType.dynamic) {
                if (body.isSleeping) {
                    this.sleepingBodies.set(body.id, body);
                } else {
                    this.activeBodies.set(body.id, body);
                }
            } else if (body.type === BodyType.static) {
                this.staticBodies.set(body.id, body);
            } else if (body.type === BodyType.kinematic) {
                this.kinematicBodies.set(body.id, body);
            }

            const sleepStartId = body.on('sleep-start', () => {
                this.activeBodies.delete(body.id);
                this.sleepingBodies.set(body.id, body);
            });
            const sleepEndId = body.on('sleep-end', () => {
                this.sleepingBodies.delete(body.id);
                this.activeBodies.set(body.id, body);
            });
            const becomeDynamicId = body.on('become-dynamic', (event) => {
                if (event.previousType === BodyType.static) {
                    this.staticBodies.delete(body.id);
                } else if (event.previousType === BodyType.kinematic) {
                    this.kinematicBodies.delete(body.id);
                }

                this.activeBodies.set(body.id, body);
            });
            const becomeStaticId = body.on('become-static', (event) => {
                if (event.previousType === BodyType.dynamic) {
                    if (body.isSleeping) {
                        this.sleepingBodies.delete(body.id);
                    } else {
                        this.activeBodies.delete(body.id);
                    }
                } else if (event.previousType === BodyType.kinematic) {
                    this.kinematicBodies.delete(body.id);
                }

                this.staticBodies.set(body.id, body);
            });
            const becomeKinematicId = body.on('become-kinematic', (event) => {
                if (event.previousType === BodyType.dynamic) {
                    if (body.isSleeping) {
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
        return bodies;
    }

    /**
     * Removes the given bodies from the world.
     * @param bodies
     */
    removeBody (...bodies: Body[]) {
        
        for (const body of bodies) {
            if (this.bodies.has(body.id)) {
                this.trigger('remove-body', [{body}]);
                this.bodies.delete(body.id);
            }

            this.engine.manager.aabbTree.removeBody(body);
            body.engine = undefined;

            if (body.type === BodyType.dynamic) {
                if (body.isSleeping) {
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
                body.off(eventId);
            }
        }
        return bodies;
    }

    /**
     * Returns the body with the given id if the body exists in the world.
     * @param id
     * @returns The Body with the given id if the body exists in the world
     */
     getBody (id: number) {
        return this.bodies.get(id);
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

    /**
     * Returns true if the body with given id exists in the world.
     * @param id 
     * @returns True if the body with given id exists in the world
     */
     hasBody (id: number) {
        return this.bodies.has(id);
    }

    /**
     * Returns all bodies that exists in the world.
     * @returns All bodies that exists in the world
     */
    allBodies () {
        return [...this.bodies.values()];
    }

    /**
     * Adds the given joints to the world.
     */
    addJoint (...joints: Joint[]) {
        for (const joint of joints) {
            this.trigger('add-joint', [{joint}]);
            this.joints.set(joint.id, joint);
        }
        return joints;
    }

    /**
     * Removes the given joints from the world.
     * @param joints
     */
    removeJoint (...joints: Joint[]) {
        for (const joint of joints) {
            if (this.joints.has(joint.id)) {
                this.trigger('remove-joint', [{joint}]);
                this.joints.delete(joint.id);
            }
        }
        return joints;
    }

    /**
     * Returns the joint with the given id if a joint exists in the world.
     * @param id
     * @returns The joint with the given id if a joint exists in the world
     */
    getJoint (id: number) {
        return this.joints.get(id);
    }

    /**
     * Returns true if the joint with the given id exists in the world.
     * @param id
     * @returns True if the joint with the given id exists in the world
     */
    hasJoint (id: number) {
        return this.joints.has(id);
    }

    /**
     * Returns all joints that exists in the world.
     * @returns All joints that exists in the world
     */
    allJoints () {
        return [...this.joints.values()];
    }

    /**
     * Returns the array of all bodies and joints that exists in the world.
     * @returns The array of all bodies and joints that exists in the world
     */
    all () {
        let all = [...this.bodies.values(), ...this.joints.values()];

        return all;
    }

    /**
     * Removes all bodies from the world.
     */
    clearBodies () {
        this.bodies.clear();
    }

    /**
     * Removes all joints from the world.
     */
    clearJoints () {
        this.joints.clear();
    }

    /**
     * Removes all objects from the world.
     */
    clear () {
        this.clearBodies();
        this.clearJoints();
    }

}