import { Vector } from '../../math/Vector';
import { Bounds } from '../../math/Bounds';
import { RaycastResult } from './RaycastResult';
import { Common } from '../../common/Common';
import { Intersection } from './Intersection';

export class Ray {

    constructor (options = {}) {

        this.from = new Vector();
        this.to = new Vector();
        this.delta = new Vector();
        
        this.bounds = new Bounds();
        this.needsUpdate = true;

        this.raycastResult = new RaycastResult();

        this.set(options);

    }

    set (options) {
        for (const option of Object.entries(options)) {
            switch (option[0]) {
                case 'from':
                    this.setFrom(option[1]);
                    break;
                case 'to':
                    this.setTo(option[1]);
                    break;
            }
        }
    }

    cast (engine, composite = undefined, useGrid = true, result = this.raycastResult) {
        result.reset();

        if (this.needsUpdate) {
            this.updateBounds();
            Vector.subtract(this.to, this.from, this.delta);
        }

        this.delta.clone(result.delta);
        this.to.clone(result.to);
        this.from.clone(result.from);

        if (!composite) {
            composite = engine.world;
        }

        const intersections = result.intersections;

        if (useGrid) {
            const gridSize = engine.manager.broadphase.gridSize;
            const from = Ray.vecTemp[0];
            const to = Ray.vecTemp[1];
            
            from.x = (this.from.x / gridSize);
            from.y = (this.from.y / gridSize);
            to.x = (this.to.x / gridSize);
            to.y = (this.to.y / gridSize);
            const delta = Vector.subtract(to, from, Ray.vecTemp[2]);
            const sign = Ray.vecTemp[4];
            const abs = Ray.vecTemp[5];

            let x;
            let y;
            let x1;
            let y1;
            let x2;
            let y2;

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
            this.collide(intersection, result);
        }

        this.needsUpdate = false;
        return result;
    }

    setFrom (from) {
        from.clone(this.from);
        this.needsUpdate = true;
    }

    setTo (to) {
        to.clone(this.to);
        this.needsUpdate = true;
    }

    updateBounds () {
        this.bounds.min.x = Math.min(this.from.x, this.to.x);
        this.bounds.min.y = Math.min(this.from.y, this.to.y);
        this.bounds.max.x = Math.max(this.from.x, this.to.x);
        this.bounds.max.y = Math.max(this.from.y, this.to.y);
        return this.bounds;
    }

    collide (intersection) {
        if (!intersection.isActive) return;
        intersection.isActive = false;

        const shape = intersection.shape;

        if (this.bounds.overlaps(shape.bounds)) {

            intersection.reset();
            shape.raycast(intersection, this.from, this.to, this.delta);
            if (intersection.contactsCount > 0) intersection.isActive = true;
        }
    }

    addCell (engine, composite, position, result) {
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

Ray.vecTemp = [
    new Vector(),
    new Vector(),
    new Vector(),
    new Vector(),
    new Vector(),
    new Vector(),
]