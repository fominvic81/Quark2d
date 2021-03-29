import { Vector } from '../../math/Vector';
import { Bounds } from '../../math/Bounds';
import { RaycastResult } from './RaycastResult';
import { Common } from '../../common/Common';
import { Intersection } from './Intersection';
import { Composite } from '../../common/Composite';

interface RayOptions {
    from?: Vector;
    to?: Vector;
}

/**
 * The 'Ray' is a class used for raycasting.
 * @example https://codepen.io/fominvic81/pen/yLgJmLq?editors=0010
 */

export class Ray {

    from: Vector = new Vector();
    to: Vector = new Vector();
    delta: Vector = new Vector();
    bounds: Bounds = new Bounds();
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
     * @param useGrid
     * @param result
     * @returns Result
     */
    cast (engine: any, composite: Composite = engine.world, useGrid: boolean = true, result: RaycastResult = this.raycastResult) { //TODO-types
        result.reset();

        if (this.needsUpdate) {
            this.updateBounds();
            Vector.subtract(this.to, this.from, this.delta);
        }

        this.delta.clone(result.delta);
        this.to.clone(result.to);
        this.from.clone(result.from);

        const intersections = result.intersections;

        if (useGrid) {
            const gridSize: number = engine.manager.broadphase.gridSize;
            const from: Vector = Ray.vecTemp[0];
            const to: Vector = Ray.vecTemp[1];
            
            from.x = (this.from.x / gridSize);
            from.y = (this.from.y / gridSize);
            to.x = (this.to.x / gridSize);
            to.y = (this.to.y / gridSize);
            const delta: Vector = Vector.subtract(to, from, Ray.vecTemp[2]);
            const sign: Vector = Ray.vecTemp[4];
            const abs: Vector = Ray.vecTemp[5];

            let x: number;
            let y: number;
            let x1: number;
            let y1: number;
            let x2: number;
            let y2: number;

            if (delta.x > 0) {
                sign.x = 1;
                abs.x = delta.x;

                x = Math.floor(from.x + 0.0001);

                x1 = Math.ceil(from.x + 0.0001);
            } else {
                sign.x = -1;
                abs.x = -delta.x;

                x = Math.floor(from.x - 0.0001);

                if (delta.y > 0) {
                    from.x -= 1;
                }

                x1 = Math.floor(from.x - 0.0001);
            }

            if (delta.y > 0) {
                sign.y = 1;
                abs.y = delta.y;

                y = Math.floor(from.y + 0.0001);

                y2 = Math.ceil(from.y + 0.0001);
            } else {
                sign.y = -1;
                abs.y = -delta.y;

                y = Math.floor(from.y - 0.0001);

                if (delta.x > 0) {
                    from.y -= 1;
                }

                y2 = Math.floor(from.y - 0.0001);
            }

            this.addCell(engine, composite, Ray.vecTemp[3].set(x, y), result);
            
            
            const xy = delta.x / abs.y;
            const yx = delta.y / abs.x;

            y1 = from.y + yx * Math.abs(from.x - x1);

            if (delta.y < 0) {
                if (delta.x > 0) {
                    y1 += 1;
                } else {
                    x1 -= 1;
                }
            }

            const dy = yx;

            for (let i = 0; i < abs.x; ++i) {
                this.addCell(engine, composite, Ray.vecTemp[3].set(x1 + i * sign.x, Math.floor(y1)), result);
                y1 += dy;
            }

            x2 = from.x + xy * Math.abs(from.y - y2);
            if (delta.x < 0) {
                if (delta.y < 0) {
                    y2 -= 1;
                } else {
                    x2 += 1;
                }
            }

            const dx = xy;

            for (let i = 0; i < abs.y; ++i) {
                this.addCell(engine, composite, Ray.vecTemp[3].set(Math.floor(x2), y2 + i * sign.y), result);
                x2 += dx;
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

    private updateBounds () {
        this.bounds.min.x = Math.min(this.from.x, this.to.x);
        this.bounds.min.y = Math.min(this.from.y, this.to.y);
        this.bounds.max.x = Math.max(this.from.x, this.to.x);
        this.bounds.max.y = Math.max(this.from.y, this.to.y);
        return this.bounds;
    }

    private collide (intersection: Intersection) {
        if (!intersection.isActive) return;
        intersection.isActive = false;

        const shape = intersection.shape;

        if (this.bounds.overlaps(shape.bounds)) {

            intersection.reset();
            shape.raycast(intersection, this.from, this.to, this.delta);
            if (intersection.contactsCount > 0) intersection.isActive = true;
        }
    }

    private addCell (engine: any, composite: Composite, position: Vector, result: RaycastResult) { // TODO-types
        const intersections = result.intersections;
        const cell = engine.manager.broadphase.grid.get(position);
        if (cell) {
            for (const shape of cell.values()) {
                const body = shape.body;
                if (!composite.hasBody(body.id)) continue;

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
}