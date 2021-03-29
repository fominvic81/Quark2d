import { Vector } from '../../math/Vector';
import { Intersection } from './Intersection';

/**
 * Storage for data about ray casting.
 */

export class RaycastResult {
    from: Vector = new Vector();
    to: Vector = new Vector();
    delta: Vector = new Vector();
    intersections: Map<number, Intersection> = new Map();

    reset () {
        for (const intersection of this.intersections.values()) {
            intersection.isActive = false;
        }
    }

    clear () {
        this.intersections.clear();
    }

}