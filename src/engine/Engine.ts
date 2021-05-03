import { Vector } from '../math/Vector';
import { Solver } from '../collision/solver/Solver';
import { Events } from '../common/Events';
import { Sleeping } from '../body/Sleeping';
import { World } from '../common/World';
import { Manager } from '../collision/phase/Manager';
import { Broadphase } from '../collision/phase/Broadphase';
import { Midphase } from '../collision/phase/Midphase';
import { Narrowphase } from '../collision/phase/narrowphase/Narrowphase';
import { Shape } from '../body/shapes/Shape';
import { Body } from '../body/Body';
import { AABB } from '../math/AABB';

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
    timestamp?: {delta: number, tps?: number};

    constructor (options: EngineOptions = {}) {
        this.world = options.world || new World();
        this.gravity = options.gravity === undefined ? new Vector(0, 9.8) : options.gravity.clone();
        this.manager = new Manager(this, options);
        this.solver = options.solver || new Solver(this);
        this.sleeping = options.sleeping || new Sleeping(this);
        this.events = new Events();
        this.timestamp = undefined;
    }

    /**
     * Moves engine forward in time by timestamp.delta.
     * @param timestamp
     */
    update (timestamp: {delta: number, tps?: number}) {
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
        for (const body of this.world.kinematicBodies.values()) {
            body.updatePosition();
        }

        this.events.trigger('after-update', [{engine: this, timestamp}]);
    }

    /**
     * Removes shape from broadphase. Must be called after removing shape from body.
     * @param shape
     */
    removeShape (...shapes: Shape[]) {
        for (const shape of shapes) {
            this.manager.removeShape(shape);
        }
    }

    /**
     * Removes body from broadphase. Must be called after removing body from world.
     * @param body
     */
    removeBody (...bodies: Body[]) {
        for (const body of bodies) {
            this.manager.removeBody(body);
        }
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