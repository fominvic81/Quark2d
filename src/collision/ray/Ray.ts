import { Vector } from '../../math/Vector';
import { RaycastResult } from './RaycastResult';
import { Engine } from '../../engine/Engine';
import { AABB } from '../../math/AABB';
import { Filter } from '../../body/Filter';

export interface RayOptions {
    from?: Vector;
    to?: Vector;
    filter?: {
        category?: number,
        mask?: number,
        group?: number,
    };
}

const aabb = new AABB();

/**
 * The 'Ray' is a class used for raycasting.
 */

export class Ray {

    from: Vector = new Vector();
    to: Vector = new Vector();
    delta: Vector = new Vector();
    result: RaycastResult = new RaycastResult();
    filter: Filter = new Filter();

    constructor (options: RayOptions = {}) {
        this.set(options.from ?? this.from, options.to ?? this.to);

        if (options.filter) {
            this.filter.category = options.filter.category ?? this.filter.category;
            this.filter.mask = options.filter.mask ?? this.filter.mask;
            this.filter.group = options.filter.group ?? this.filter.group;
        }
    }

    /**
     * Sets the 'from' and 'to' of the ray to the given.
     * @param from
     * @param to
     */
    set (from: Vector, to: Vector) {
        from.clone(this.from);
        to.clone(this.to);
    }

    /**
     * Casts the ray.
     * @param engine
     * @param useBroadphase
     * @param useRadius
     * @param result
     * @returns Result
     */
    cast (engine: Engine, useBroadphase: boolean = true, useRadius: boolean = true, result: RaycastResult = this.result) {
        result.reset();

        Vector.subtract(this.to, this.from, this.delta);

        this.delta.clone(result.delta);
        this.to.clone(result.to);
        this.from.clone(result.from);

        if (useBroadphase) {
            for (const shape of engine.manager.aabbTree.raycast(this.from, this.delta)) {
                if (Filter.canCollide(shape.filter, this.filter)) {
                    const intersection = result.createIntersection(shape);

                    if (useRadius) {
                        if (intersection.shape.raycastRadius(intersection, this.from, this.to, this.delta)) {
                            result.intersections.push(intersection);
                        } else {
                            result.intersectionsPool.push(intersection);
                        }
                    } else {
                        if (intersection.shape.raycast(intersection, this.from, this.to, this.delta)) {
                            result.intersections.push(intersection);
                        } else {
                            result.intersectionsPool.push(intersection);
                        }
                    }
                }
            }
        } else {
            if (this.to.x < this.from.x) {
                aabb.minX = this.to.x;
                aabb.maxX = this.from.x;
            } else {
                aabb.minX = this.from.x;
                aabb.maxX = this.to.x;
            }
            if (this.to.y < this.from.y) {
                aabb.minY = this.to.y;
                aabb.maxY = this.from.y;
            } else {
                aabb.minY = this.from.y;
                aabb.maxY = this.to.y;
            }
            for (const body of engine.world.bodies.values()) {
                for (const shape of body.shapes) {
                    if (Filter.canCollide(shape.filter, this.filter)) {
                        if (aabb.overlaps(shape.aabb)) {
                            const intersection = result.createIntersection(shape);

                            if (useRadius) {
                                if (intersection.shape.raycastRadius(intersection, this.from, this.to, this.delta)) {
                                    result.intersections.push(intersection);
                                } else {
                                    result.intersectionsPool.push(intersection);
                                }
                            } else {
                                if (intersection.shape.raycast(intersection, this.from, this.to, this.delta)) {
                                    result.intersections.push(intersection);
                                } else {
                                    result.intersectionsPool.push(intersection);
                                }
                            }
                        }
                    }
                }
            }
        }
        return result;
    }
}