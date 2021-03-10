import { Vector } from '../math/Vector';
import { Solver } from '../collision/solver/Solver';
import { Events } from '../common/Events';
import { Sleeping } from '../body/Sleeping';
import { World } from '../common/World';
import { Manager } from '../collision/phase/Manager';

export class Engine {

    constructor (options = {}) {
        this.world = options.world || new World();
        this.gravity = options.gravity === undefined ? new Vector(0, 9.8) : Vector.clone(options.gravity);
        this.manager = new Manager(this, options);
        this.solver = options.solver || new Solver(this);
        this.sleeping = options.sleeping || new Sleeping(this);
        this.events = new Events();
        this.timestamp = undefined;

        this.world.events.on('remove-body', (event) => {
            this.broadphase.removeBodyFromGrid(event.body);
        });
    }

    update (timestamp) {
        this.timestamp = timestamp;

        this.events.trigger('before-update', [{engine: this, timestamp}]);
        this.events.trigger('update', [{engine: this, timestamp}]);

        this.sleeping.update(timestamp.delta);

        this.applyGravity();

        this.updateBodies(timestamp.delta);

        this.manager.update();

        this.sleeping.afterCollisions();

        if (this.manager.startedPairs.length) {
            this.events.trigger('started-collisions', [{pairs: this.manager.startedPairs}]);
        }

        if (this.manager.activePairs.length) {
            this.events.trigger('active-collisions', [{pairs: this.manager.activePairs}]);
        }

        if (this.manager.endedPairs.length) {
            this.events.trigger('ended-collisions', [{pairs: this.manager.endedPairs}]);
        }

        this.solver.update();

        if (this.manager.startedPairs.length) {
            this.events.trigger('started-collisions-after-solve', [{pairs: this.manager.startedPairs}]);
        }

        if (this.manager.activePairs.length) {
            this.events.trigger('active-collisions-after-solve', [{pairs: this.manager.activePairs}]);
        }

        if (this.manager.endedPairs.length) {
            this.events.trigger('ended-collisions-after-solve', [{pairs: this.manager.endedPairs}]);
        }


        this.events.trigger('after-update', [{engine: this, timestamp}]);
        
    }

    applyGravity () {
        for (const body of this.world.activeBodies.values()) {
            body.force.x += this.gravity.x * body.mass;
            body.force.y += this.gravity.y * body.mass;
        }
    }

    updateBodies (dt) {
        for (const body of this.world.activeBodies.values()) {
            body.update(dt);
        }
    }
};