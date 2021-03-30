import { Vector } from '../math/Vector';
import { Solver } from '../collision/solver/Solver';
import { Events } from '../common/Events';
import { Sleeping } from '../body/Sleeping';
import { World } from '../common/World';
import { Manager } from '../collision/phase/Manager';
import { Broadphase } from '../collision/phase/Broadphase';
import { Midphase } from '../collision/phase/Midphase';
import { Narrowphase } from '../collision/phase/narrowphase/Narrowphase';

interface EngineOptions {
    world?: World;
    gravity?: Vector;
    solver?: Solver;
    sleeping?: Sleeping;
    broadphase?: Broadphase;
    midphase?: Midphase;
    narrowphase?: Narrowphase;
}

/**
 * The 'Engine' is a class that manages updating the simulation of the world.
 */

export class Engine {
    world: World;
    gravity: Vector;
    manager: Manager;
    solver: Solver;
    sleeping: Sleeping;
    events: Events;
    timestamp?: {delta: number};

    constructor (options: EngineOptions = {}) {
        this.world = options.world || new World();
        this.gravity = options.gravity === undefined ? new Vector(0, 9.8) : options.gravity.clone();
        this.manager = new Manager(this, options);
        this.solver = options.solver || new Solver(this);
        this.sleeping = options.sleeping || new Sleeping(this);
        this.events = new Events();
        this.timestamp = undefined;

        this.world.events.on('remove-body', (event) => {
            this.manager.broadphase.removeBodyFromGrid(event.body);
        });
    }

    /**
     * Moves engine forward in time by timestamp.delta.
     * @param timestamp
     */
    update (timestamp: {delta: number}) {
        this.timestamp = timestamp;

        this.events.trigger('before-update', [{engine: this, timestamp}]);
        this.events.trigger('update', [{engine: this, timestamp}]);

        this.sleeping.update(timestamp.delta);

        this.applyGravity();

        for (const body of this.world.activeBodies.values()) {
            body.updateVelocity(timestamp.delta);
        }

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

        for (const body of this.world.activeBodies.values()) {
            body.updatePosition();
        }

        this.events.trigger('after-update', [{engine: this, timestamp}]);
        
    }

    /**
     * Applies gravity force to all bodies.
     */
    applyGravity () {
        for (const body of this.world.activeBodies.values()) {
            body.force.x += this.gravity.x * body.mass;
            body.force.y += this.gravity.y * body.mass;
        }
    }
};