import { Vector } from '../../math/Vector';

export class RaycastResult {

    constructor () {

        this.from = new Vector();
        this.to = new Vector();
        this.delta = new Vector();

        this.intersections = new Map();
    }

    reset () {
        for (const intersection of this.intersections.values()) {
            intersection.isActive = false;
        }
    }

    clear () {
        this.intersections.clear();
    }

}