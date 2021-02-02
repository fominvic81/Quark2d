import { Vector } from '../../math/Vector';
import { Bounds } from '../../math/Bounds';
import { Common } from '../../common/Common';
import { Filter } from '../Filter';
import { Solver } from '../../collision/solver/Solver';

export class Shape {

    constructor (options = {}) {
        this.id = Common.nextId();
        this.name = 'shape';
        this.body = undefined;
        this.worldPosition = new Vector();
        this.bounds = new Bounds();
        this.inertia = options.inertia;
        this.area = 0;
        this.radius = options.radius !== undefined ? options.radius + Solver.SLOP / 2 : Solver.SLOP / 2;
        this.filter = new Filter();
        if (options.filter) {
            if (options.filter.category !== undefined) this.filter.category = options.filter.category;
            if (options.filter.mask !== undefined) this.filter.mask = options.filter.mask;
            if (options.filter.group !== undefined) this.filter.group = options.filter.group;
        }
        this.restitution = options.restitution !== undefined ? options.restitution : 0.1;
        this.friction = options.friction !== undefined ? options.friction : 0.1;
        this.frictionStatic = options.frictionStatic !== undefined ? options.frictionStatic : 0.5;
        this.surfaceVelocity = options.surfaceVelocity !== undefined ? options.surfaceVelocity : 0;
    }

    getWorldPosition () {
        return this.worldPosition;
    }

    translate (offset) {}

    rotate (angle) {}

    updateArea () {}
    
    updateInertia () {}

    updateBounds () {}

    getBounds () {
        this.updateBounds();
        return this.bounds;
    }

    raycast (intersection, from, to, delta) {}

}

Shape.CIRCLE = Math.pow(2, 0);
Shape.CONVEX = Math.pow(2, 1);
Shape.EDGE = Math.pow(2, 2);