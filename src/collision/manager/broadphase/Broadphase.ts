import { AABB } from '../../../math/AABB';
import { Vector } from '../../../math/Vector';
import { Pair } from '../../pair/Pair';
import { Shape } from '../../../body/shapes/Shape';
import { Manager } from '../Manager';
import { Body, BodyType } from '../../../body/Body';
import { Common } from '../../../common/Common';
import { Engine } from '../../../engine/Engine';
import { AABBTree } from './AABBTree';

const aabbTemp = new AABB();

export interface BroadphaseOptions {
    aabbGrow?: number;
    velocityFactor?: number;
}

export class Broadphase {
    aabbTree: AABBTree = new AABBTree();
    activePairs: Set<Pair> = new Set();
    aabbGrow: number;
    velocityFactor: number;
    endedPairs: Set<Pair> = new Set();
    manager: Manager;
    engine: Engine;

    constructor (manager: Manager, options: BroadphaseOptions = {}) {
        this.manager = manager;
        this.engine = manager.engine;

        this.aabbGrow = options.aabbGrow ?? 0.3;
        this.velocityFactor = options.velocityFactor ?? 3;

        for (const body of this.engine.world.bodies.values()) {
            for (const shape of body.shapes) {
                this.addShape(shape);
            }
        }
    }

    update (dt: number) {
        for (const body of this.engine.world.activeBodies.values()) {
            for (const shape of body.shapes) {
                this.updateShape(shape, dt);
            }
        }
        for (const body of this.engine.world.kinematicBodies.values()) {
            for (const shape of body.shapes) {
                this.updateShape(shape, dt);
            }
        }
        this.manager.endedPairs.push(...this.endedPairs);
        this.endedPairs.clear();
    }

    updateShape (shape: Shape, dt: number) {
        const node = shape.AABBTreeNode;
        const body = shape.body!;
        const enlargedAABB = shape.aabb.clone(aabbTemp);

        const vf = this.velocityFactor * dt;
        if (body.velocity.x > 0) {
            enlargedAABB.maxX += body.velocity.x * vf;
        } else {
            enlargedAABB.minX += body.velocity.x * vf;
        }
        if (body.velocity.y > 0) {
            enlargedAABB.maxY += body.velocity.y * vf;
        } else {
            enlargedAABB.minY += body.velocity.y * vf;
        }

        if (AABB.isInside(enlargedAABB, node.aabb)) return;
        if (body.velocity.x > 0) {
            enlargedAABB.maxX += body.velocity.x * vf;
        } else {
            enlargedAABB.minX += body.velocity.x * vf;
        }
        if (body.velocity.y > 0) {
            enlargedAABB.maxY += body.velocity.y * vf;
        } else {
            enlargedAABB.minY += body.velocity.y * vf;
        }
        enlargedAABB.minX -= this.aabbGrow;
        enlargedAABB.minY -= this.aabbGrow;
        enlargedAABB.maxX += this.aabbGrow;
        enlargedAABB.maxY += this.aabbGrow;

        this.aabbTree.remove(node);

        for (const nodeB of this.aabbTree.aabbTest(node.aabb)) {
            const shapeB = nodeB.shape!;

            const pairId = Common.combineId(shape.id, shapeB.id);
            const pair = this.manager.pairs.get(pairId)!;

            if (pair) {
                if (pair.isActive) {
                    this.endedPairs.add(pair);
                }
                this.activePairs.delete(pair);
            }
        }

        for (const nodeB of this.aabbTree.aabbTest(enlargedAABB)) {
            const shapeB = nodeB.shape!;
            const bodyB = shapeB.body!;

            if ((body === bodyB) || (body.type !== BodyType.dynamic && bodyB.type !== BodyType.dynamic)) continue;

            const pairId = Common.combineId(shape.id, shapeB.id);
            const p = this.manager.pairs.get(pairId);
            const pair = p || new Pair(shape, shapeB);

            this.activePairs.add(pair);
            this.endedPairs.delete(pair);

            if (!p) {
                this.manager.pairs.set(pairId, pair);
            }
        }
        enlargedAABB.clone(node.aabb);

        this.aabbTree.insert(node);

    }

    addShape (shape: Shape) {
        const body = shape.body!;

        const enlargedAABB = shape.aabb.clone(aabbTemp);

        const vf = this.velocityFactor / 60;
        if (body.velocity.x > 0) {
            enlargedAABB.maxX += body.velocity.x * vf;
        } else {
            enlargedAABB.minX += body.velocity.x * vf;
        }
        if (body.velocity.y > 0) {
            enlargedAABB.maxY += body.velocity.y * vf;
        } else {
            enlargedAABB.minY += body.velocity.y * vf;
        }
        enlargedAABB.minX -= this.aabbGrow;
        enlargedAABB.minY -= this.aabbGrow;
        enlargedAABB.maxX += this.aabbGrow;
        enlargedAABB.maxY += this.aabbGrow;

        for (const node of this.aabbTree.aabbTest(enlargedAABB)) {
            const shapeB = node.shape!;
            const bodyB = shapeB.body!;

            if ((body === bodyB) || (body.type !== BodyType.dynamic && bodyB.type !== BodyType.dynamic)) continue;

            const pairId = Common.combineId(shape.id, shapeB.id);
            const p = this.manager.pairs.get(pairId);
            const pair = p || new Pair(shape, shapeB);

            this.activePairs.add(pair);
            this.endedPairs.delete(pair);

            if (!p) {
                this.manager.pairs.set(pairId, pair);
            }
        }

        const node = shape.AABBTreeNode;
        enlargedAABB.clone(node.aabb);
        this.aabbTree.insert(node);
    }

    removeShape (shape: Shape) {
        const node = shape.AABBTreeNode;

        this.aabbTree.remove(node);

        for (const nodeB of this.aabbTree.aabbTest(node.aabb)) {
            const shapeB = nodeB.shape!;

            const pairId = Common.combineId(shape.id, shapeB.id);
            const pair = this.manager.pairs.get(pairId);

            if (pair) {
                if (pair.isActive) {
                    this.endedPairs.add(pair);
                }
                this.activePairs.delete(pair);
            }
        }
    }

    addBody (body: Body) {
        for (const shape of body.shapes) {
            this.addShape(shape);
        }
    }
    
    removeBody (body: Body) {
        for (const shape of body.shapes) {
            this.removeShape(shape);
        }
    }

    *pointTest (point: Vector) {
        for (const node of this.aabbTree.pointTest(point)) {
            yield node.shape!;
        }
    }

    *aabbTest (aabb: AABB) {
        for (const node of this.aabbTree.aabbTest(aabb)) {
            yield node.shape!;
        }
    }

    *raycast (start: Vector, end: Vector) {
        for (const node of this.aabbTree.raycast(start, end)) {
            yield node.shape!;
        }
    }

    getPairsCount () {
        return this.activePairs.size;
    }
}