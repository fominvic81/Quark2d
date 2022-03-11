import { AABB } from '../../../math/AABB';
import { Vector } from '../../../math/Vector';
import { Shape } from '../../../body/shapes/Shape';

const aabbTemp = new AABB();

export class AABBTreeNode {
    aabb: AABB = new AABB();
    shape?: Shape;
    parent?: AABBTreeNode;
    left?: AABBTreeNode;
    right?: AABBTreeNode;
    height: number = 0;

    update () {
        if (this.left) {
            this.height = Math.max(this.left.height, this.right!.height) + 1;
            AABB.union(this.left.aabb, this.right!.aabb, this.aabb);
        } else {
            this.height = 0;
        }
        return this.parent;
    }

    balance () {
        const balance = this.getBalance();

        if (balance > 1) {
            if (this.left!.getBalance() > 0) {
                this.rightRotate();
            } else {
                this.left!.leftRotate();
                this.rightRotate();
            }
        } else if (balance < -1) {
            if (this.right!.getBalance() < 0) {
                this.leftRotate();
            } else {
                this.right!.rightRotate();
                this.leftRotate();
            }
        }
        if (this.left) {
            this.left.update();
            this.right!.update();
        }

        return this.update();
    }

    getBalance () {
        const lH = this.left ? this.left.height : -1;
        const rH = this.right ? this.right.height : -1;
        return lH - rH;
    }

    rightRotate () {
        const A = this;
        const B = A.left!;
        const P = A.parent;
        A.left = B.right;
        if (B.right) B.right.parent = A;
        B.right = A;
        A.parent = B;
        B.parent = P;
        if (P) {
            if (P.left === A) {
                P.left = B;
            } else {
                P.right = B;
            }
        }
        return B;
    }

    leftRotate () {
        const A = this;
        const B = A.right!;
        const P = A.parent;
        A.right = B.left;
        if (B.left) B.left.parent = A;
        B.left = A;
        A.parent = B;
        B.parent = P;
        if (P) {
            if (P.left === A) {
                P.left = B;
            } else {
                P.right = B;
            }
        }
        return B;
    }
}

export class AABBTree {
    root?: AABBTreeNode;
    nodeStack: AABBTreeNode[] = [];

    getNewNode () {
        return this.nodeStack.pop() ?? new AABBTreeNode();
    }

    insert (node: AABBTreeNode) {
        if (!this.root) {
            this.root = node;
            return;
        }
        const aabb = node.aabb;

        let best = this.root;

        while (best.left) {

            const childA = best.left!;
            const childB = best.right!;

            const cost = best.aabb.perimeter();

            const childACost = AABB.union(aabb, childA.aabb, aabbTemp).perimeter() - childA.aabb.perimeter();
            const childBCost = AABB.union(aabb, childB.aabb, aabbTemp).perimeter() - childB.aabb.perimeter();

            if (childACost > cost && childBCost > cost) break;

            if (childACost < childBCost) {
                best = childA;
            } else {
                best = childB;
            }
        };

        const newNode = this.getNewNode();
        const parent = best.parent;

        if (parent) {
            if (parent.left === best) {
                parent.left = newNode;
            } else {
                parent.right = newNode;
            }
            newNode.parent = parent;
        } else {
            this.root = newNode;
            this.root.parent = undefined;
        }

        newNode.left = best;
        best.parent = newNode;

        newNode.right = node;
        node.parent = newNode;

        newNode.update();

        let n: AABBTreeNode | undefined = newNode;
        while (n) {
            n = n.balance();
        }
        if (this.root.parent) this.root = this.root.parent;
    }

    remove (node: AABBTreeNode) {
        const parent = node.parent;
        if (!parent) {
            this.root = undefined;
            return;
        }
        const sibiling = (parent.left === node) ? parent.right! : parent.left!;
        const grandParent = parent.parent

        if (grandParent) {
            if (grandParent.left === parent) {
                grandParent.left = sibiling;
            } else {
                grandParent.right = sibiling;
            }
            sibiling.parent = grandParent;
            grandParent.update();

            let n: AABBTreeNode | undefined = grandParent;
            while (n) {
                n = n.balance();
            }
            if (this.root?.parent) this.root = this.root.parent;
        } else {
            this.root = sibiling;
            this.root.parent = undefined;
        }
        this.nodeStack.push(parent);
    }

    *pointTest (point: Vector) {
        if (!this.root) return;
        const stack = [this.root];

        while (stack.length) {

            const node = stack.pop()!;

            if (node.aabb.contains(point)) {
                if (node.left) {
                    stack.push(node.left);
                    stack.push(node.right!);
                } else {
                    yield node;
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
                if (node.left) {
                    stack.push(node.left);
                    stack.push(node.right!);
                } else {
                    yield node;
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

            if (node.left) {
                stack.push(node.left);
                stack.push(node.right!);
            } else {
                yield node;
            }
        }
    }
}