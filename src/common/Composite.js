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
                case 'composite':
                    this.addComposite(object);
                    break;
            }
        }

    }

    addBody (bodies) {
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        
        for (const body of bodies) {
            this.events.trigger('before-add', [{object: body}]);
            this.bodies.set(body.id, body);
            this.events.trigger('after-add', [{object: body}]);
        }
    }

    removeBody (bodies, deep = true) {
        if (!Array.isArray(bodies)) {
            bodies = [bodies];
        }

        let stack = [this];
        let l = bodies.length;

        while (stack.length > 0) {
            const composite = stack.pop();
                
            for (const body of bodies) {
                if (composite.bodies.has(body.id)) {
                    this.events.trigger('before-remove', [{object: body}]);
                    composite.bodies.delete(body.id);
                    this.events.trigger('after-remove', [{object: body}]);

                    --l;
                }
            }
            if (l <= 0 && !deep) break;

            for (const composite1 of composite.composites.values()) {
                stack.push(composite1);
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
        let allBodies = [...this.bodies.values()];
        
        for (const composite of this.composites.values()) {
            allBodies = allBodies.concat(composite.allBodies());
        }

        return allBodies;
    }

    addConstraint (constraints) {
        if (!Array.isArray(constraints)) {
            constraints = [constraints];
        }
        for (const constraint of constraints) {
            this.events.trigger('before-add', [{object: constraint}]);
            this.constraints.set(constraint.id, constraint);
            this.events.trigger('after-add', [{object: constraint}]);
        }
    }

    removeConstraint (constraints, deep = true) {
        if (!Array.isArray(constraints)) {
            constraints = [constraints];
        }

        let stack = [this];
        let count = constraints.length;

        while (stack.length > 0) {
            const composite = stack.pop();
                
            for (const constraint of constraints) {
                if (composite.constraints.has(constraint.id)) {
                    this.events.trigger('before-remove', [{object: constraint}]);
                    composite.constraints.delete(constraint.id);
                    this.events.trigger('after-remove', [{object: constraint}]);

                    --count;
                }
            }
            if (count <= 0 && !deep) break;

            for (const composite1 of composite.composites.values()) {
                stack.push(composite1);
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
        let allConstraints = [...this.constraints.values()];
        
        for (const composite of this.composites.values()) {
            allConstraints = allConstraints.concat(composite.allConstraints());
        }

        return allConstraints;
    }

    addComposite (composites) {
        if (!Array.isArray(composites)) {
            composites = [composites];
        }

        for (const composite of composites) {
            this.events.trigger('before-add', [{object: composite}]);
            this.composites.set(composite.id, composite);
            this.events.trigger('after-add', [{object: composite}]);
        }
    }

    removeComposite (composites, deep = true) {
        if (!Array.isArray(composites)) {
            composites = [composites];
        }

        let stack = [this];
        let count = composites.length;

        while (stack.length > 0) {
            const composite = stack.pop();
                
            for (const composite of composites) {
                if (composite.composites.has(composite.id)) {
                    this.events.trigger('before-remove', [{object: composite}]);
                    composite.composites.delete(composite.id);
                    this.events.trigger('after-remove', [{object: composite}]);

                    --count;
                }
            }
            if (count <= 0 && !deep) break;

            for (const composite1 of composite.composites.values()) {
                stack.push(composite1);
            }
        }
    }

    all () {
        let all = [...this.allBodies(), ...this.allConstraints()];

        return all;
    }

    clearBodies () {
        this.removeBody(this.allBodies(), true);
    }

    clearConstraints () {
        this.removeConstraint(this.allConstraints(), true);
    }

    clear () {
        this.composites.clear();
        this.removeBody(this.allBodies(), false);
        this.removeConstraint(this.allConstraints(), false);
    }

};