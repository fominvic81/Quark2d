import { Vector } from '../../math/Vector';
import { AABB } from '../../math/AABB';
import { RaycastResult } from './RaycastResult';
import { Common } from '../../common/Common';
import { Intersection } from './Intersection';
import { Composite } from '../../common/Composite';
import { Engine } from '../../engine/Engine';
import { GridBroadphase } from '../phase/broadphase/Grid';

interface RayOptions {
    from?: Vector;
    to?: Vector;
}

/**
 * The 'Ray' is a class used for raycasting.
 */

export class Ray {

    from: Vector = new Vector();
    to: Vector = new Vector();
    delta: Vector = new Vector();
    aabb: AABB = new AABB();
    needsUpdate: boolean = true;
    raycastResult: RaycastResult = new RaycastResult();

    private static vecTemp = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
    ];

    constructor (options: RayOptions = {}) {
        this.set(options.from ?? this.from, options.to ?? this.to);
    }

    /**
     * Sets the 'from' and 'to' of the ray to the given.
     * @param from
     * @param to
     */
    set (from: Vector, to: Vector) {
        this.setFrom(from);
        this.setTo(to);
    }

    /**
     * Casts the ray.
     * @param engine
     * @param composite
     * @param useBroadphase
     * @param result
     * @returns Result
     */
    cast (engine: Engine, composite: Composite = engine.world, useBroadphase: boolean = true, result: RaycastResult = this.raycastResult) {
        result.reset();

        if (this.needsUpdate) {
            this.updateAABB();
            Vector.subtract(this.to, this.from, this.delta);
        }

        this.delta.clone(result.delta);
        this.to.clone(result.to);
        this.from.clone(result.from);

        const intersections = result.intersections;

        if (useBroadphase) {
            const intersections = result.intersections;
            for (const shape of engine.manager.broadphase.raycast(this.from, this.to)) {
                const body = shape.body!;
                if (!composite.hasBody(body.id)) continue;

                const id = Common.combineId(body.id, shape.id);
                let intersection = intersections.get(id);
                if (!intersection) {
                    intersection = new Intersection(body, shape);
                    intersections.set(id, intersection);
                }
                intersection.isActive = true;
            }
        } else {
            for (const body of composite.bodies.values()) {
                for (const shape of body.shapes) {
                    const id = Common.combineId(body.id, shape.id);
                    let intersection = intersections.get(id);
                    if (!intersection) {
                        intersection = new Intersection(body, shape);
                        intersections.set(id, intersection);
                    }
                    intersection.isActive = true;
                }
            }
        }

        for (const intersection of intersections.values()) {
            this.collide(intersection);
        }

        this.needsUpdate = false;
        return result;
    }

    /**
     * Sets the 'from' of the ray to the given.
     * @param from
     */
    setFrom (from: Vector) {
        from.clone(this.from);
        this.needsUpdate = true;
    }

    /**
     * Sets the 'to' of the ray to the given.
     * @param to
     */
    setTo (to: Vector) {
        to.clone(this.to);
        this.needsUpdate = true;
    }

    private updateAABB () {
        this.aabb.minX = Math.min(this.from.x, this.to.x);
        this.aabb.minY = Math.min(this.from.y, this.to.y);
        this.aabb.maxX = Math.max(this.from.x, this.to.x);
        this.aabb.maxY = Math.max(this.from.y, this.to.y);
        return this.aabb;
    }

    private collide (intersection: Intersection) {
        if (!intersection.isActive) return;
        intersection.isActive = false;

        const shape = intersection.shape;

        if (this.aabb.overlaps(shape.aabb)) {

            intersection.reset();
            shape.raycast(intersection, this.from, this.to, this.delta);
            if (intersection.contactsCount > 0) intersection.isActive = true;
        }
    }
}