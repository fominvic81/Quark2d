import { Vector } from '../../math/Vector';
import { Bounds } from '../../math/Bounds';
import { Common } from '../../common/Common';
import { Filter } from '../Filter';


export class Shape {

    constructor (options = {}) {
        this.id = Common.nextId();
        this.name = 'shape';
        this.body = undefined;
        this.position = new Vector();
        this.worldPosition = new Vector();
        this.bounds = new Bounds();
        this.angle = 0;
        this.inertia = options.inertia;
        this.area = 0;
        this.filter = new Filter();
        if (options.filter) {
            if (options.filter.category !== undefined) this.filter.category = options.filter.category;
            if (options.filter.mask !== undefined) this.filter.mask = options.filter.mask;
            if (options.filter.group !== undefined) this.filter.group = options.filter.group;
        }
        this.restitution = options.restitution !== undefined ? options.restitution : 0.1;
        this.friction = options.friction !== undefined ? options.friction : 0.1;
        this.frictionStatic = options.frictionStatic !== undefined ? options.frictionStatic : 0.5;
    }

    getWorldPosition () {
        Vector.add(Vector.rotate(this.position, this.body.angle, this.worldPosition), this.body.position, this.worldPosition);
        return this.worldPosition;
    }

    getWorldAngle () {
        return this.angle + this.body.angle;
    }

    updateArea () {}
    
    updateInertia () {}

    updateBounds () {}

    getBounds () {
        this.updateBounds();
        return this.bounds;
    }

}

Shape.AAB = Math.pow(2, 0);
Shape.CIRCLE = Math.pow(2, 1);
Shape.CONVEX = Math.pow(2, 2);