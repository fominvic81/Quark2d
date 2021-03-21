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

        Vector.interpolate(this.start, this.end, 0.5, this.position);

        Vector.neg(this.normal, this.ngNormal);
    }

    project (vector) {
        return Vector.dot(this.start, vector) < Vector.dot(this.end, vector);
    }

    translate (offset) {
        Vector.add(this.position, offset);
        Vector.add(this.start, offset);
        Vector.add(this.end, offset);
    }

    rotate (angle) {
        const delta = Vector.temp[0];
        Vector.subtract(this.position, this.start, delta);
        Vector.rotate(delta, angle);
        Vector.subtract(this.position, delta, this.start);

        Vector.subtract(this.position, this.end, delta);
        Vector.rotate(delta, angle);
        Vector.subtract(this.position, delta, this.end);

        Vector.rotate(this.normal, angle);
        Vector.neg(this.normal, this.ngNormal);
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

    raycast (intersection, from, to, delta) {

        const contact = intersection.contacts[0];

        const point = Vector.lineLineIntersection(this.start, this.end, from, to, contact.point);
        if (point) {

            Vector.clone(this.normal, contact.normal);
            if (Vector.dot(delta, contact.normal) > 0) {
                Vector.neg(contact.normal);
            }
            ++intersection.contactsCount;

        }

    }

    contains (point) {

        const v = Vector.subtract(point, this.start, Vector.temp[0]);
        const delta = Vector.subtract(this.end, this.start, Vector.temp[1]);

        if (Math.abs(Vector.dot(v, this.normal)) > this.radius) return false;

        const dot = Vector.dot(v, delta);

        if (dot < 0) return Vector.lengthSquared(v) < Math.pow(this.radius, 2);
        if (dot > Math.pow(this.length, 2)) return Vector.lengthSquared(Vector.subtract(point, this.end, v)) < Math.pow(this.radius, 2);
        return true;
    }

    getPoint (index) {
        return index ? this.end : this.start;
    }

    getNormal (index, output) {
        return Vector.clone((index ? this.normal : this.ngNormal), output);
    }
}