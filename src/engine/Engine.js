import { Composite } from '../common/Composite';
import { Vector } from '../math/Vector';
import { Broadphase } from '../collision/broadphase';
import { Midphase } from '../collision/midphase';
import { Narrowphase } from '../collision/narrowphase/Narrowphase';
import { Solver } from '../collision/Solver';
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
        this.runner = options.runner;

        if (this.runner) {
            this.runner.events.on('update', (timestamp) => {
                this.update(timestamp);
            });
        }

        this.world.events.on('beforeRemove', (event) => {
            if (event.object.name === 'body') {
                this.broadphase.removeBodyFromGrid(event.object);
            }
        });
    }

    update (timestamp) {
        this.timestamp = timestamp;

        this.events.trigger('beforeUpdate', [{engine: this, timestamp}]);
        this.events.trigger('update', [{engine: this, timestamp}]);

        this.sleeping.update(timestamp.delta);

        this.applyGravity();

        this.updateBodies(timestamp.delta);
        
        this.broadphase.update();
        this.midphase.update();
        this.narrowphase.update();

        this.sleeping.afterCollisions();

        if (this.narrowphase.startedPairs.length) {
            this.events.trigger('startedPairs', [{pairs: this.narrowphase.startedPairs}]);
        }

        this.solver.update();
                
        if (this.narrowphase.activePairs.length) {
            this.events.trigger('activePairs', [{pairs: this.narrowphase.activePairs}]);
        }

        if (this.narrowphase.endedPairs.length) {
            this.events.trigger('endedPairs', [{pairs: this.narrowphase.endedPairs}]);
        }


        this.events.trigger('afterUpdate', [{engine: this, timestamp}]);
        
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