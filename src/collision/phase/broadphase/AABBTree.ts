import { AABB } from '../../../math/AABB';
import { Vector } from '../../../math/Vector';
import { Pair } from '../../pair/Pair';
import { Broadphase, BroadphaseOptions, BroadphaseType } from './Broadphase';
import { Shape } from '../../../body/shapes/Shape';
import { Manager } from '../Manager';
import { Body, BodyType } from '../../../body/Body';
import { Common } from '../../../common/Common';

export class AABBTreeNode {
    aabb: AABB = new AABB();
    shape?: Shape;
    isLeaf: boolean = false;
    isChildA: boolean = false;
    parent?: AABBTreeNode;
    childA?: AABBTreeNode;
    childB?: AABBTreeNode;
}

const aabbTemp = new AABB();

export interface AABBTreeOptions extends BroadphaseOptions {
    aabbGrow?: number;
    velocityFactor?: number;
}

export class AABBTree extends Broadphase {
    type = BroadphaseType.AABBTree;
    activePairs: Set<Pair> = new Set();
    root?: AABBTreeNode;
    aabbGrow: number;
    velocityFactor: number;
    nodesStack: AABBTreeNode[] = [];
    endedPairs: Set<Pair> = new Set();

    constructor (manager: Manager, options: AABBTreeOptions = {}) {
        super(manager, options);

        this.aabbGrow = options.aabbGrow ?? 0.1;
        this.velocityFactor = options.velocityFactor ?? 3;

        for (const body of this.engine.world.bodies.values()) {
            for (const shape of body.shapes) {
                this.addShape(shape);
            }
        }
    }

    update () {
        this.endedPairs.clear();
        for (const body of this.engine.world.activeBodies.values()) {
            for (const shape of body.shapes) {
                this.updateShape(shape);
            }
        }
        for (const body of this.engine.world.kinematicBodies.values()) {
            for (const shape of body.shapes) {
                this.updateShape(shape);
            }
        }
        this.manager.endedPairs.push(...this.endedPairs);
    }

    updateShape (shape: Shape) {

        let node = shape.AABBTreeNode;

        if (!node) return;

        if (AABB.isInside(shape.aabb, node.aabb)) return;

        this.removeShape(shape);
        this.insert(shape);

        const body = shape.body!;
        for (const shapeB of this.aabbTest(node.aabb)) {
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
    }

    getNewNode () {
        const newNode = this.nodesStack.pop();
        if (!newNode) return new AABBTreeNode();
        return newNode;
    }

    addShape (shape: Shape) {
        this.insert(shape);

        shape.AABBTreeNode!.aabb.minX = -Infinity;
        shape.AABBTreeNode!.aabb.minY = -Infinity;
        shape.AABBTreeNode!.aabb.maxX = -Infinity;
        shape.AABBTreeNode!.aabb.maxY = -Infinity;
        this.updateShape(shape);
    }

    private insert (shape: Shape) {

        const newLeaf = shape.AABBTreeNode || this.getNewNode();
        shape.AABBTreeNode = newLeaf;

        const aabb = newLeaf.aabb;
        shape.aabb.clone(aabb);

        const w = aabb.getWidth();
        const h = aabb.getHeight();

        aabb.minX -= this.aabbGrow * w;
        aabb.minY -= this.aabbGrow * h;
        aabb.maxX += this.aabbGrow * w;
        aabb.maxY += this.aabbGrow * h;

        const body = shape.body!;
        if (body.velocity.x > 0) {
            aabb.maxX += body.velocity.x * this.velocityFactor;
        } else {
            aabb.minX += body.velocity.x * this.velocityFactor;
        }
        if (body.velocity.y > 0) {
            aabb.maxY += body.velocity.y * this.velocityFactor;
        } else {
            aabb.minY += body.velocity.y * this.velocityFactor;
        }

        if (!this.root) {
            this.root = newLeaf;
            this.root.shape = shape;
            this.root.isLeaf = true;
            this.root.parent = undefined;
            return;
        }

        let best = this.root;
        AABB.union(aabb, best.aabb, aabbTemp);

        while (!best.isLeaf) {

            const curPerimeter = best.aabb.perimeter();

            const childA = best.childA!;
            const childB = best.childB!;

            const cost = curPerimeter;

            const childACost = AABB.union(aabb, childA.aabb, aabbTemp).perimeter() - childA.aabb.perimeter();
            const childBCost = AABB.union(aabb, childB.aabb, aabbTemp).perimeter() - childB.aabb.perimeter();

            if (childACost > cost && childBCost > cost) break;

            if (childACost < childBCost) {
                best = childA;
            } else {
                best = childB;
            }
        }


        const oldParent = best.parent;
        const newParent = this.getNewNode();
        newParent.isChildA = best.isChildA;
        newParent.parent = oldParent;
        newParent.isLeaf = false;

        if (oldParent) {
            if (best.isChildA) {
                oldParent.childA = newParent;
            } else {
                oldParent.childB = newParent;
            }
        } else {
            this.root = newParent;
        }

        newLeaf.parent = newParent;
        newLeaf.isChildA = true;
        newLeaf.isLeaf = true;
        newLeaf.shape = shape;
        newParent.childA = newLeaf;

        newParent.childB = best;
        best.isChildA = false;
        best.parent = newParent;

        let node: AABBTreeNode | undefined = newParent;

        while (node) {
            AABB.union(node.childA!.aabb, node.childB!.aabb, node.aabb);
            node = node.parent;
        }
    }

    removeShape (shape: Shape) {

        const node = shape.AABBTreeNode;
        if (!node) return;

        const parent = node.parent;
        if (!parent) {
            this.root = undefined;
            return;
        }
        const grandParent = parent.parent;
        const otherChild = node.isChildA ? parent.childB! : parent.childA!;

        if (grandParent) {

            otherChild.isChildA = parent.isChildA;
            if (parent.isChildA) {
                grandParent.childA = otherChild;
            } else {
                grandParent.childB = otherChild;
            }
            otherChild.parent = grandParent;

            let node: AABBTreeNode | undefined = grandParent;

            while (node) {
                AABB.union(node.childA!.aabb, node.childB!.aabb, node.aabb);
                node = node.parent;
            }
        } else {
            this.root = otherChild;
            this.root.parent = undefined;
        }

        this.nodesStack.push(parent);

        for (const shapeB of this.aabbTest(node.aabb)) {
            const pairId = Common.combineId(shape.id, shapeB.id);
            const pair = this.manager.pairs.get(pairId);

            if (pair?.isActive) {
                this.endedPairs.add(pair);
            }
            this.activePairs.delete(pair!);
        }
    }

    addBody (body: Body) {
        for (const shape of body.shapes) this.addShape(shape);
    }

    removeBody (body: Body) {
        for (const shape of body.shapes) this.removeShape(shape);
    }

    *pointTest (point: Vector) {
        if (!this.root) return;
        const stack = [this.root];

        while (stack.length) {

            const node = stack.pop()!;

            if (node.aabb.contains(point)) {
                if (node.isLeaf) {
                    yield node.shape!;
                } else {
                    stack.push(node.childA!);
                    stack.push(node.childB!);
                }
            }
        }
    }

    *aabbTest (aabb: AABB) {
        if (!this.root) return;
        const stack = [this.root];

        while (stack.length) {

            const node = stack.pop()!;

            if (node.aabb.overlaps(aabb)) {
                if (node.isLeaf) {
                    yield node.shape!;
                } else {
                    stack.push(node.childA!);
                    stack.push(node.childB!);
                }
            }
        }
    }

    *raycast (start: Vector, delta: Vector) {
        if (!this.root) return;
        const stack = [this.root];

        while (stack.length) {

            const node = stack.pop()!;

            const fraction = node.aabb.raycast(start, delta);
            if (fraction === Infinity) continue;

            if (node.isLeaf) {
                yield node.shape!;
            } else {
                stack.push(node.childA!);
                stack.push(node.childB!);
            }

        }
    }

    getPairsCount () {
        return this.activePairs.size;
    }
}