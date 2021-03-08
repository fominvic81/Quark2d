import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Shape } from './Shape';


export class Edge extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'edge';
        this.type = Shape.EDGE;

        this.start = new Vector(-0.5, 0);
        this.end = new Vector(0.5, 0);
        this.length = 1;
        this.delta = new Vector();
        this.normal = new Vector();
        this.ngNormal = new Vector();
        this.projection = {};

        this.set(options.start || this.start, options.end || this.end);

        this.updateArea();

        this.updateInertia();
    }

    set (start, end) {
        Vector.clone(start, this.start);
        Vector.clone(end, this.end);

        Vector.subtract(this.end, this.start, this.delta);
        this.length = Vector.length(this.delta);

        Vector.divide(this.delta, this.length, this.normal);
        Vector.rotate90(this.normal);
        
        Vector.set(
            this.position,
            this.start.x + this.delta.x / 2,
            this.start.y + this.delta.y / 2,
        );

        Vector.neg(this.normal, this.ngNormal);
    }

    project (vector, output = this.projection) {

        const sDot = Vector.dot(this.start, vector);
        const eDot = Vector.dot(this.end, vector);

        if (sDot > eDot) {
            output.value = sDot;
            output.index = 0;
        } else {
            output.value = eDot;
            output.index = 1;
        }

        return output;
    }

    translate (offset) {
        Vector.add(this.position, offset);
        Vector.add(this.start, offset);
        Vector.add(this.end, offset);
    }

    updateArea () {
        this.area = 2 * this.length * this.radius + Math.pow(this.radius, 2) * Math.PI;
        return this.area;
    }

    updateInertia () {
        this.inertia = 0;

        // https://www.efunda.com/math/areas/CircleHalf.cfm

        const width = this.length;
        const height = this.radius * 2;

        const rectArea = width * height;
        const rectInertia = rectArea * (Math.pow(width, 2) + Math.pow(height, 2)) / 12;

        // ((Math.PI / 4) - 8 / (9 * Math.PI)) * 2 = 1.0049120846903796
        const circleArea = Math.PI * Math.pow(this.radius, 2);
        const circleInertia = 1.0049120846903796 * Math.pow(this.radius, 4);

        const distSquared = Math.pow(this.length * 0.5 + (4 * this.radius) / (Common.PI3), 2);

        this.inertia = (rectInertia + circleInertia + circleArea * distSquared) / this.area;

        return this.inertia;
    }

    updateBounds () {
        if (this.start.x < this.end.x) {
            this.bounds.min.x = this.start.x - this.radius;
            this.bounds.max.x = this.end.x + this.radius;
        } else {
            this.bounds.min.x = this.end.x - this.radius;
            this.bounds.max.x = this.start.x + this.radius;
        }
        if (this.start.y < this.end.y) {
            this.bounds.min.y = this.start.y - this.radius;
            this.bounds.max.y = this.end.y + this.radius;
        } else {
            this.bounds.min.y = this.end.y - this.radius;
            this.bounds.max.y = this.start.y + this.radius;
        }
        return this.bounds;
    }

    getPoint (index) {
        return index ? this.end : this.start;
    }

    getNormal (index, output) {
        return Vector.clone((index ? this.normal : this.ngNormal), output);
    }
}