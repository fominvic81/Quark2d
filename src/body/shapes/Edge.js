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
            this.worldPosition,
            this.start.x + this.delta.x / 2,
            this.start.y + this.delta.y / 2,
        );
    }

    translate (offset) {
        Vector.add(this.worldPosition, offset);
        Vector.add(this.start, offset);
        Vector.add(this.end, offset);
    }

    updateArea () {
        this.area = 2 * this.length * this.radius + Math.pow(this.radius, 2) * Math.PI;
        return this.area;
    }

    updateInertia () {
        this.inertia = 0.1;
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
}