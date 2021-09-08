import { Vector } from '../math/Vector';
import { Solver, SolverOptions } from '../collision/solver/Solver';
import { Events } from '../common/Events';
import { Sleeping, SleepingOptions } from '../body/Sleeping';
import { World } from '../common/World';
import { Manager } from '../collision/phase/Manager';
import { BroadphaseOptions } from '../collision/phase/broadphase/Broadphase';
import { AABB } from '../math/AABB';
import { GridBroadphase, GridBroadphaseOptions } from '../collision/phase/broadphase/Grid';
import { AABBTree, AABBTreeOptions } from '../collision/phase/broadphase/AABBTree';
/* develblock:start */
import { Timer } from '../tools/debug/Timer';
/* develblock:end */

interface EngineOptions {
    world?: World;
    gravity?: Vector;
    solverOptions?: SolverOptions;
    sleepingOptions?: SleepingOptions;
    broadphaseConstructor?: (typeof GridBroadphase) | (typeof AABBTree);
    broadphaseOptions?: BroadphaseOptions | GridBroadphaseOptions | AABBTreeOptions;
}

/**
 * The 'Engine' is a class that manages updating the simulation of the world.
 * 
 * Events:
 * * before-update
 * * update
 * * started-collisions
 * * active-collisions
 * * ended-collisions
 * * started-collisions-after-solve
 * * active-collisions-after-solve
 * * ended-collisions-after-solve
 * * after-update
 */

export class Engine extends Events {
    world: World;
    gravity: Vector;
    manager: Manager;
    solver: Solver;
    sleeping: Sleeping;
    timestamp?: {delta: number, tps?: number};
    /* develblock:start */
    timer: Timer = new Timer();
    /* develblock:end */

    constructor (options: EngineOptions = {}) {
        super();
        this.world = options.world ?? new World(this);
        this.gravity = options.gravity === undefined ? new Vector(0, 9.8) : options.gravity.copy();
        this.manager = new Manager(this, options);
        this.solver = new Solver(this, options.solverOptions);
        this.sleeping = new Sleeping(this, options.sleepingOptions);
        this.timestamp = undefined;
    }

    /**
     * Moves engine forward in time by timestamp.delta.
     * @param timestamp
     */
    update (timestamp: {delta: number, tps?: number}) {
        this.timestamp = timestamp;

        this.trigger('before-update', [{engine: this, timestamp}]);
        this.trigger('update', [{engine: this, timestamp}]);

        for (const body of this.world.activeBodies.values()) {
            body.updatePosition();
        }
        for (const body of this.world.kinematicBodies.values()) {
            body.updatePosition();
        }

        this.manager.update();

        this.sleeping.afterCollisions();

        this.trigger('started-collisions', [{pairs: this.manager.startedPairs}]);
        this.trigger('active-collisions', [{pairs: this.manager.activePairs}]);
        this.trigger('ended-collisions', [{pairs: this.manager.endedPairs}]);

        /* develblock:start */
        this.timer.timeStart('Solver preStep')
        /* develblock:end */
        
        this.solver.preStep();

        /* develblock:start */
        this.timer.timeEnd('Solver preStep')
        /* develblock:end */

        for (const body of this.world.activeBodies.values()) {
            body.updateVelocity(timestamp.delta, this.gravity);
        }

        /* develblock:start */
        this.timer.timeStart('Solver step')
        /* develblock:end */

        this.solver.step();

        /* develblock:start */
        this.timer.timeEnd('Solver step')
        /* develblock:end */

        this.sleeping.afterSolve(timestamp.delta);

        this.trigger('started-collisions-after-solve', [{pairs: this.manager.startedPairs}]);
        this.trigger('active-collisions-after-solve', [{pairs: this.manager.activePairs}]);
        this.trigger('ended-collisions-after-solve', [{pairs: this.manager.endedPairs}]);

        this.trigger('after-update', [{engine: this, timestamp}]);
    }

    /**
     * Returns all shapes that contains given point.
     * @param point
     */
    *pointTest (point: Vector) {
        const broadphaseShapes = this.manager.broadphase.pointTest(point);

        for (const shape of broadphaseShapes) {
            if (shape.aabb.contains(point)) {
                if (shape.contains(point)) {
                    yield shape;
                }
            }
        }
    }


    /**
     * Returns all shapes whose aabbs overlaps given aabb.
     * @param aabb
     */

    *aabbTest (aabb: AABB) {
        const broadphaseShapes = this.manager.broadphase.aabbTest(aabb);

        for (const shape of broadphaseShapes) {
            if (aabb.overlaps(shape.aabb)) {
                yield shape;
            }
        }
    }

    category: number = 1;
};