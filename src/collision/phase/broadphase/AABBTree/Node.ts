import { Shape } from '../../../../body/shapes/Shape';
import { AABB } from '../../../../math/AABB';

export class AABBTreeNode {
    aabb: AABB = new AABB();
    shape?: Shape;
    isLeaf: boolean = false;
    isChildA: boolean = false;
    parent?: AABBTreeNode;
    childA?: AABBTreeNode;
    childB?: AABBTreeNode;
}