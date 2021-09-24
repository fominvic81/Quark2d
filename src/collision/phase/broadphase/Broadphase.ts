import { Body } from '../../../body/Body';
import { Shape } from '../../../body/shapes/Shape';
import { Engine } from '../../../engine/Engine';
import { AABB } from '../../../math/AABB';
import { Vector } from '../../../math/Vector';
import { Pair } from '../../pair/Pair';
import { Manager } from '../Manager';

export enum BroadphaseType {
    Grid,
    AABBTree,
}

export interface BroadphaseOptions {

}

export abstract class Broadphase {
    abstract type: BroadphaseType;
    manager: Manager;
    engine: Engine;
    abstract activePairs: Iterable<Pair>;

    constructor (manager: Manager, options: BroadphaseOptions = {}) {
        this.manager = manager;
        this.engine = manager.engine;
    }

    abstract update (dt: number): void;

    abstract addShape (shape: Shape): void;

    abstract removeShape (shape: Shape): void;

    abstract addBody (body: Body): void;

    abstract removeBody (body: Body): void;

    abstract pointTest (point: Vector): Generator<Shape>;

    abstract aabbTest (aabb: AABB): Generator<Shape>;

    abstract raycast (start: Vector, delta: Vector): Generator<Shape>

    abstract getPairsCount (): number;
}