import { Events } from './Events';
import { Common } from './Common';
import { Body } from '../body/Body';
import { Joint } from '../joint/Joint';

/**
 * The 'Composite' is a container for bodies and joints.
 */

export class Composite extends Events {
    id: number = Common.nextId();
    name: string = 'composite';
    bodies: Map<number, Body> = new Map();
    joints: Map<number, Joint> = new Map();

    /**
     * Adds given objects to the composite.
     * @param objects
     */
    add (...objects: Array<Body | Joint>) {
        for (const object of objects) {
            switch (object.name) {
                case 'body':
                    this.addBody(<Body>object);
                    break;
                case 'joint':
                    this.addJoint(<Joint>object);
                    break;
            }
        }

    }

    /**
     * Adds the given bodies to the composite.
     * @param bodies
     */
    addBody (...bodies: Body[]) {
        for (const body of bodies) {
            this.trigger('add-body', [{body}]);
            this.bodies.set(body.id, body);
        }
    }

    /**
     * Removes the given bodies from the composite.
     * @param bodies
     */
    removeBody (...bodies: Body[]) {
        for (const body of bodies) {
            if (this.bodies.has(body.id)) {
                this.trigger('remove-body', [{body}]);
                this.bodies.delete(body.id);
            }
        }
    }

    /**
     * Returns the body with the given id if the body exists in the composite.
     * @param id
     * @returns The Body with the given id if the body exists in the composite
     */
    getBody (id: number) {
        return this.bodies.get(id);
    }

    /**
     * Returns true if the body with the given id exists in the composite.
     * @param id 
     * @returns True if the body with the given id exists in the composite
     */
    hasBody (id: number) {
        return this.bodies.has(id);
    }

    /**
     * Returns all bodies that exists in the composite.
     * @returns All bodies that exists in the composite
     */
    allBodies () {
        return [...this.bodies.values()];
    }

    /**
     * Adds the given joints to the composite.
     */
    addJoint (...joints: Joint[]) {
        for (const joint of joints) {
            this.trigger('add-joint', [{joint}]);
            this.joints.set(joint.id, joint);
        }
    }

    /**
     * Removes the given joints from the composite.
     * @param joints
     */
    removeJoint (...joints: Joint[]) {
        for (const joint of joints) {
            if (this.joints.has(joint.id)) {
                this.trigger('remove-joint', [{joint}]);
                this.joints.delete(joint.id);
            }
        }
    }

    /**
     * Returns the joint with the given id if the joint exists in the composite.
     * @param id
     * @returns The joint with the given id if the joint exists in the composite
     */
    getJoint (id: number) {
        return this.joints.get(id);
    }

    /**
     * Returns true if the joint with the given id exists in the composite.
     * @param id
     * @returns True if the joint with the given id exists in the composite
     */
    hasJoint (id: number) {
        return this.joints.has(id);
    }

    /**
     * Returns all joints that exists in the composite.
     * @returns All joints that exists in the composite
     */
    allJoints () {
        return [...this.joints.values()];
    }

    /**
     * Adds all bodies and joints from given composite.
     * @param composite
     */
    merge (composite: Composite) {
        this.add(...composite.bodies.values());
        this.add(...composite.joints.values());
    }

    /**
     * Returns the array of all bodies and joints that exists in the composite.
     * @returns The array of all bodies and joints that exists in the composite
     */
    all () {
        let all = [...this.bodies.values(), ...this.joints.values()];

        return all;
    }

    /**
     * Removes all bodies from the composite.
     */
    clearBodies () {
        this.bodies.clear();
    }

    /**
     * Removes all joints from the composite.
     */
    clearJoints () {
        this.joints.clear();
    }

    /**
     * Removes all objects from the composite.
     */
    clear () {
        this.clearBodies();
        this.clearJoints();
    }

};