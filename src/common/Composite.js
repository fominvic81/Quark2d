import { Events } from './Events';
import { Common } from './Common';

export class Composite {

    constructor () {
        this.id = Common.nextId();
        this.name = 'composite';
        this.bodies = new Map();
        this.constraints = new Map();
        this.composites = new Map();
        this.events = new Events();
    }

    add (objects) {
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

    addBody (bodies) {
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        for (const body of bodies) {
            this.events.trigger('add-body', [{body}]);
            this.bodies.set(body.id, body);
        }
    }

    removeBody (bodies) {
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

    getBody (id) {
        return this.bodies.get(id);
    }

    hasBody (id) {
        return this.bodies.has(id);
    }

    allBodies () {
        return [...this.bodies.values()];
    }

    addConstraint (constraints) {
        if (!Array.isArray(constraints)) {
            constraints = [constraints];
        }
        for (const constraint of constraints) {
            this.events.trigger('add-constraint', [{constraint}]);
            this.constraints.set(constraint.id, constraint);
        }
    }

    removeConstraint (constraints) {
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


    getConstraint (id) {
        return this.constraints.get(id);
    }

    hasConstraint (id) {
        return this.constraints.has(id);
    }

    allConstraints () {
        return [...this.constraints.values()];
    }

    all () {
        let all = [...this.bodies.values(), ...this.constraints.values()];

        return all;
    }

    clearBodies () {
        this.bodies.clear();
    }

    clearConstraints () {
        this.constraints.clear();
    }

    clear () {
        this.clearBodies();
        this.clearConstraints();
    }

};