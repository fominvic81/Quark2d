import { AABB } from '../../../../math/AABB';
import { Vector } from '../../../../math/Vector';
import { Pair } from '../../../pair/Pair';
import { Broadphase, BroadphaseOptions, BroadphaseType } from '../Broadphase';
import { Shape } from '../../../../body/shapes/Shape';
import { AABBTreeNode } from './Node';
import { Manager } from '../../Manager';
import { Body, BodyType } from '../../../../body/Body';
import { Common } from '../../../../common/Common';

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
    }

    updateShape (shape: Shape) {

        let node = shape.AABBTreeNode;
        if (!node) return;

        if (AABB.isInside(shape.aabb, node.aabb)) return;

        for (const shapeB of this.aabbTest(node.aabb)) {
            const pairId = Common.combineId(shape.id, shapeB.id);
            const pair = this.manager.pairs.get(pairId)!;

            this.activePairs.delete(pair);
        }
        shape.aabb.clone(node.aabb);

        const w = node.aabb.getWidth();
        const h = node.aabb.getHeight();

        node.aabb.minX -= this.aabbGrow * w;
        node.aabb.minY -= this.aabbGrow * h;
        node.aabb.maxX += this.aabbGrow * w;
        node.aabb.maxY += this.aabbGrow * h;
        const body = shape.body!;

        if (body.velocity.x > 0) {
            node.aabb.maxX += body.velocity.x * this.velocityFactor;
        } else {
            node.aabb.minX += body.velocity.x * this.velocityFactor;
        }
        if (body.velocity.y > 0) {
            node.aabb.maxY += body.velocity.y * this.velocityFactor;
        } else {
            node.aabb.minY += body.velocity.y * this.velocityFactor;
        }

        this.removeShape(shape, false);
        this.addShape(shape);

        for (const shapeB of this.aabbTest(node.aabb)) {
            const bodyB = shapeB.body!;

            if ((body === bodyB) || (body.type !== BodyType.dynamic && bodyB.type !== BodyType.dynamic)) continue;

            const pairId = Common.combineId(shape.id, shapeB.id);
            const p = this.manager.pairs.get(pairId);
            const pair = p || new Pair(shape, shapeB);

            this.activePairs.add(pair);

            if (!p) {
                this.manager.pairs.set(pairId, pair);
            }
        }
    }

    getNewNode () {
        const newNode = this.nodesStack.pop();
        if (!newNode) return new AABBTreeNode();
        return  newNode;
    }

    addShape (shape: Shape) {

        if (!this.root) {
            this.root = new AABBTreeNode();
            this.root.shape = shape;
            this.root.isLeaf = true;
            shape.aabb.clone(this.root.aabb);
            shape.AABBTreeNode = this.root;
            return;
        }

        const aabb = shape.aabb;

        let best = this.root;
        AABB.union(aabb, best.aabb, aabbTemp);

        while (!best.isLeaf) {

            const curPerimeter = best.aabb.perimeter();

            const childA = best.childA!;
            const childB = best.childB!;

            const cost = curPerimeter;

            const childACost = AABB.union(aabb, childA.aabb, aabbTemp).perimeter() - childA.aabb.perimeter();
            const childBCost = AABB.union(aabb, childB.aabb, aabbTemp).perimeter() - childB.aabb.perimeter();;

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

        const newLeaf = shape.AABBTreeNode || this.getNewNode();
        if (!shape.AABBTreeNode) shape.aabb.clone(newLeaf.aabb);
        newLeaf.parent = newParent;
        newLeaf.isChildA = true;
        newLeaf.isLeaf = true;
        newLeaf.shape = shape;
        shape.AABBTreeNode = newLeaf;
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

    removeShape (shape: Shape, removePairs: boolean = true) {

        const node = shape.AABBTreeNode;
        if (!node) return;

        const parent = node.parent;
        if (!parent) {
            this.nodesStack.push(this.root!);
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

        if (removePairs) {
            for (const shapeB of this.aabbTest(node.aabb)) {
                const pairId = Common.combineId(shape.id, shapeB.id);
                const pair = this.manager.pairs.get(pairId)!;
    
                this.activePairs.delete(pair);
            }
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

    *raycast (start: Vector, end: Vector) {
        // TODO
    }

    getPairsCount () {
        return this.activePairs.size;
    }
}