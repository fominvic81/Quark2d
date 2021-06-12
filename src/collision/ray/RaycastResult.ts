import { Shape } from '../../body/shapes/Shape';
import { Vector } from '../../math/Vector';
import { Intersection } from './Intersection';

/**
 * Storage for data about ray casting.
 */
export class RaycastResult {
    from: Vector = new Vector();
    to: Vector = new Vector();
    delta: Vector = new Vector();
    intersections: Intersection[] = [];
    intersectionsPool: Intersection[] = [];

    reset () {
        this.intersectionsPool.push(...this.intersections);
        this.intersections.length = 0;
    }

    createIntersection (shape: Shape) {
        const intersection = this.intersectionsPool.pop();

        if (intersection) {
            intersection.shape = shape;
            intersection.contactsCount = 0;

            return intersection;
        } else {
            return new Intersection(shape);
        }
    }
}