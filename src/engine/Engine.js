import { Composite } from '../common/Composite';
import { Vector } from '../math/Vector';
import { Broadphase } from '../collision/phase/broadphase';
import { Midphase } from '../collision/phase/Midphase';
import { Narrowphase } from '../collision/phase/narrowphase/Narrowphase';
import { Solver } from '../collision/solver/Solver';
import { Events } from '../common/Events';
import { Sleeping } from '../body/Sleeping';

export class Engine {

    constructor (options = {}) {
        this.world = options.world || new Composite();
        this.gravity = options.gravity === undefined ? new Vector(0, 9.8) : Vector.clone(options.gravity);
        this.broadphase = new Broadphase(this);
        this.midphase = new Midphase(this);
        this.narrowphase = new Narrowphase(this);
        this.solver = new Solver(this);
        this.sleeping = new Sleeping(this);
        this.events = new Events();
        this.timestamp = undefined;

        this.world.events.on('before-remove', (event) => {
            if (event.object.name === 'body') {
                this.broadphase.removeBodyFromGrid(event.object);
            }
        });
    }

    update (timestamp) {
        this.timestamp = timestamp;

        this.events.trigger('before-update', [{engine: this, timestamp}]);
        this.events.trigger('update', [{engine: this, timestamp}]);

        this.sleeping.update(timestamp.delta);

        this.applyGravity();

        this.updateBodies(timestamp.delta);
        
        this.broadphase.update();
        this.midphase.update();
        this.narrowphase.update();

        this.sleeping.afterCollisions();

        if (this.narrowphase.startedPairs.length) {
            this.events.trigger('started-collisions', [{pairs: this.narrowphase.startedPairs}]);
        }

        if (this.narrowphase.activePairs.length) {
            this.events.trigger('active-collisions', [{pairs: this.narrowphase.activePairs}]);
        }

        if (this.narrowphase.endedPairs.length) {
            this.events.trigger('ended-collisions', [{pairs: this.narrowphase.endedPairs}]);
        }

        this.solver.update();

        if (this.narrowphase.startedPairs.length) {
            this.events.trigger('started-collisions-after-solve', [{pairs: this.narrowphase.startedPairs}]);
        }

        if (this.narrowphase.activePairs.length) {
            this.events.trigger('active-collisions-after-solve', [{pairs: this.narrowphase.activePairs}]);
        }

        if (this.narrowphase.endedPairs.length) {
            this.events.trigger('ended-collisions-after-solve', [{pairs: this.narrowphase.endedPairs}]);
        }


        this.events.trigger('after-update', [{engine: this, timestamp}]);
        
    }

    applyGravity () {
        for (const body of this.world.allBodies()) {
            if (body.isStatic || body.sleepState === Sleeping.SLEEPING) continue;
            body.force.x += this.gravity.x * body.mass;
            body.force.y += this.gravity.y * body.mass;
        }
    }

    updateBodies (dt) {
        for (const body of this.world.allBodies()) {
            body.update(dt);
        }
    }
};