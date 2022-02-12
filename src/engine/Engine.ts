import { Vector } from '../math/Vector';
import { Solver, SolverOptions } from '../collision/solver/Solver';
import { Events } from '../common/Events';
import { Sleeping, SleepingOptions } from '../body/Sleeping';
import { World } from '../common/World';
import { Manager } from '../collision/phase/Manager';
import { AABB } from '../math/AABB';
import { AABBTreeOptions } from '../collision/phase/AABBTree/AABBTree';
import { IslandManager } from '../collision/island/IslandManager';
import { TimeOfImpact } from '../collision/timeOfImpact/TimeOfImpact';
import { BodyType } from '../body/Body';
/* develblock:start */
import { Timer } from '../tools/debug/Timer';
import { Filter } from '../Quark2d';
/* develblock:end */

const toiTranslationA = new Vector();
const toiTranslationB = new Vector();

interface EngineOptions {
    world?: World;
    gravity?: Vector;
    solverOptions?: SolverOptions;
    sleepingOptions?: SleepingOptions;
    aabbTreeOptions?: AABBTreeOptions;
    enableTOI?: boolean;
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
 * * before-presolve
 * * after-presolve
 * * before-solve
 * * after-solve
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
    islandManager: IslandManager = new IslandManager(this);
    timeOfImpact: TimeOfImpact = new TimeOfImpact();
    /* develblock:start */
    timer: Timer = new Timer();
    /* develblock:end */
    options = {
        enableTOI: true,
    };

    constructor (options: EngineOptions = {}) {
        super();
        this.world = options.world ?? new World(this);
        this.gravity = options.gravity === undefined ? new Vector(0, 9.8) : options.gravity.copy();
        this.manager = new Manager(this, options.aabbTreeOptions);
        this.solver = new Solver(this, options.solverOptions);
        this.sleeping = new Sleeping(this, options.sleepingOptions);
        this.options.enableTOI = options.enableTOI ?? true;
    }

    /**
     * Moves engine forward in time by dt seconds.
     * @param timestamp
     */
    update (dt: number) {

        this.trigger('before-update', [{engine: this, dt}]);
        this.trigger('update', [{engine: this, dt}]);

        for (const body of this.world.activeBodies.values()) {
            body.minTOI = 1;
            body.updateBias();
        }

        this.manager.beforeUpdate(dt);

        if (this.options.enableTOI) {
            for (const pair of this.manager.aabbTree.activePairs) {
                if (pair.isSensor) continue;
                if (!Filter.canCollide(pair.shapeA.filter, pair.shapeB.filter)) continue;
                const collideA = (pair.shapeA.body!.type === BodyType.static) || pair.shapeA.body!.isBullet;
                const collideB = (pair.shapeB.body!.type === BodyType.static) || pair.shapeB.body!.isBullet;
                if (!collideA && !collideB) continue;

                const bodyA = pair.shapeA.body!;
                const bodyB = pair.shapeB.body!;
                pair.shapeA.body!.velocity.clone(toiTranslationA).scale(dt);
                pair.shapeB.body!.velocity.clone(toiTranslationB).scale(dt);
                const t = this.timeOfImpact.timeOfImpact(
                    pair.shapeA, toiTranslationA, pair.shapeA.body!.angularVelocity * dt,
                    pair.shapeB, toiTranslationB, pair.shapeB.body!.angularVelocity * dt,
                    bodyA.type === BodyType.dynamic && bodyB.type === BodyType.dynamic,
                    0, Math.min(bodyA.minTOI, bodyB.minTOI),
                );

                if (bodyA.type === BodyType.dynamic) bodyA.minTOI = Math.min(bodyA.minTOI, t);
                if (bodyB.type === BodyType.dynamic) bodyB.minTOI = Math.min(bodyB.minTOI, t);
            }
        }

        for (const body of this.world.kinematicBodies.values()) {
            body.updatePosition(dt);
        }
        for (const body of this.world.activeBodies.values()) {
            body.updatePosition(dt * body.minTOI);
        }

        this.manager.update();
        this.islandManager.update();

        this.sleeping.afterCollisions();

        this.trigger('started-collisions', [{pairs: this.manager.startedPairs}]);
        this.trigger('active-collisions', [{pairs: this.manager.activePairs}]);
        this.trigger('ended-collisions', [{pairs: this.manager.endedPairs}]);

        /* develblock:start */
        this.timer.timeStart('Solver preStep');
        /* develblock:end */

        this.trigger('before-presolve');
        this.solver.preStep();
        this.trigger('after-presolve');

        /* develblock:start */
        this.timer.timeEnd('Solver preStep');
        /* develblock:end */

        for (const body of this.world.activeBodies.values()) {
            body.updateVelocity(dt, this.gravity);
        }

        /* develblock:start */
        this.timer.timeStart('Solver step')
        /* develblock:end */
        
        this.trigger('before-solve');
        this.solver.step(dt);
        this.trigger('after-solve');


        /* develblock:start */
        this.timer.timeEnd('Solver step');
        /* develblock:end */

        this.sleeping.afterSolve(dt);

        this.trigger('started-collisions-after-solve', [{pairs: this.manager.startedPairs}]);
        this.trigger('active-collisions-after-solve', [{pairs: this.manager.activePairs}]);
        this.trigger('ended-collisions-after-solve', [{pairs: this.manager.endedPairs}]);

        this.trigger('after-update', [{engine: this, dt}]);
    }

    /**
     * Returns all shapes that contains given point.
     * @param point
     */
    *pointTest (point: Vector) {
        const broadphaseShapes = this.manager.aabbTree.pointTest(point);

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
        const broadphaseShapes = this.manager.aabbTree.aabbTest(aabb);

        for (const shape of broadphaseShapes) {
            if (aabb.overlaps(shape.aabb)) {
                yield shape;
            }
        }
    }

    category: number = 1;
};