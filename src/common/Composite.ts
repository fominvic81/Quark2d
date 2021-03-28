import { Events } from './Events';
import { Common } from './Common';

/**
 * The 'Composite' is a container for bodies and constraints. You can add or remove the bodies and constraints from the composite.
 */

export class Composite {
    id: number = Common.nextId();
    name: string = 'composite';
    bodies: Map<number, any> = new Map(); // TODO-types
    constraints: Map<number, any> = new Map(); // TODO-types
    events: Events = new Events();

    /**
     * Adds given objects to the composite.
     * @param objects
     */
    add (objects: Array<any> | any) { // TODO-types
        if (!Array.isArray(objects)) {
            objects = [objects];
        }
        for (const object of objects) {
            switch (object.name) {
                case 'body':
                    this.addBody(object);
                    break;
                case 'constraint':
                    this.addConstraint(object);
                    break;
            }
        }

    }

    /**
     * Adds the given bodies to the composite.
     * @param bodies
     */
    addBody (bodies: Array<any> | any) { // TODO-types
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {
            this.events.trigger('add-body', [{body}]);
            this.bodies.set(body.id, body);
        }
    }

    /**
     * Removes the given bodies from the composite.
     * @param bodies
     */
    removeBody (bodies: Array<any> | any) { // TODO-types
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {
            if (this.bodies.has(body.id)) {
                this.events.trigger('remove-body', [{body}]);
                this.bodies.delete(body.id);
            }
        }
    }

    /**
     * Returns the body with the given id if the body exists in the composite.
     * @param id
     * @returns
     */
    getBody (id: number) { // TODO-types
        return this.bodies.get(id);
    }

    /**
     * Returns true if the body with the given id exists in the composite.
     * @param id 
     * @returns
     */
    hasBody (id: number) {  // TODO-types
        return this.bodies.has(id);
    }

    /**
     * Returns all bodies that exists in the composite.
     * @returns
     */
    allBodies () {
        return [...this.bodies.values()];
    }

    /**
     * Adds the given constraints to the composite.
     */
    addConstraint (constraints: Array<any>) { // TODO-types
        if (!Array.isArray(constraints)) {
            constraints = [constraints];
        }
        for (const constraint of constraints) {
            this.events.trigger('add-constraint', [{constraint}]);
            this.constraints.set(constraint.id, constraint);
        }
    }

    /**
     * Removes the given constraints from the composite.
     * @param constraints
     */
    removeConstraint (constraints: Array<any>) { // TODO-types
        if (!Array.isArray(constraints)) {
            constraints = [constraints];
        }

        for (const constraint of constraints) {
            if (this.constraints.has(constraint.id)) {
                this.events.trigger('remove-constraint', [{constraint}]);
                this.constraints.delete(constraint.id);
            }
        }
    }

    /**
     * Returns the constraint with the given id if the constraint exists in the composite.
     * @param id
     * @returns
     */
    getConstraint (id: number) { // TODO-types
        return this.constraints.get(id);
    }

    /**
     * Returns true if the constraint with the given id exists in the composite.
     * @param id
     * @returns
     */
    hasConstraint (id: number) { // TODO-types
        return this.constraints.has(id);
    }

    /**
     * Returns all constraints that exists in the composite.
     * @returns
     */
    allConstraints () {
        return [...this.constraints.values()];
    }

    /**
     * Returns the array of all bodies and constraints that exists in the composite.
     * @returns
     */
    all () {
        let all = [...this.bodies.values(), ...this.constraints.values()];

        return all;
    }

    /**
     * Removes all bodies from the composite.
     */
    clearBodies () {
        this.bodies.clear();
    }

    /**
     * Removes all constraints from the composite.
     */
    clearConstraints () {
        this.constraints.clear();
    }

    /**
     * Removes all objects from the composite.
     */
    clear () {
        this.clearBodies();
        this.clearConstraints();
    }

};