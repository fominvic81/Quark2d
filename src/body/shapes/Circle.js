import { Shape } from './Shape';
import { Vector } from '../../math/Vector';
import { Solver } from '../../collision/solver/Solver';

export class Circle extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'circle';
        this.type = Shape.CIRCLE;
        this.radius = options.radius + Solver.SLOP / 2 || 0.5 + Solver.SLOP / 2;

        this.updateArea();

        if (!this.inertia) {
            this.inertia = this.updateInertia();
        }
    }

    translate (offset) {
        Vector.add(this.position, offset);
    }

    updateArea () {
        this.area = Math.PI * Math.pow(this.radius, 2);
        return this.area;
    }
    
    updateInertia () {
        this.inertia = Math.pow(this.radius, 2) / 2;
        return this.inertia;
    }

    updateBounds () {
        this.bounds.min.set(-this.radius, -this.radius);
        this.bounds.max.set(this.radius, this.radius);
        this.bounds.translate(this.position);
        return this.bounds;
    }

    raycast (intersection, from, to, delta) {

        const position = this.position;
        const radius = this.radius;

        const posDelta = Vector.subtract(from, position, Vector.temp[0]);

        const a = delta.lengthSquared();
        const b = 2 * Vector.dot(delta, posDelta);
        const c = posDelta.lengthSquared() - Math.pow(radius, 2);
        const d = Math.pow(b, 2) - 4 * a * c;

        if (d < 0) {
            return intersection;
        }
        if (d === 0) { // one intersection
            // TODO
            return intersection;
        }
        const dSqrt = Math.sqrt(d);
        const inverse2a = 1 / (2 * a);
        const p1 = (-b - dSqrt) * inverse2a;
        const p2 = (dSqrt - b) * inverse2a;

        if (p1 >= 0 && p1 <= 1) {
            const contact = intersection.contacts[intersection.contactsCount];
            ++intersection.contactsCount;

            Vector.interpolate(from, to, p1, contact.point);
            
            Vector.subtract(contact.point, position, contact.normal);
            contact.normal.divide(radius);
        }

        if (p2 >= 0 && p2 <= 1) {
            const contact = intersection.contacts[intersection.contactsCount];
            ++intersection.contactsCount;

            Vector.interpolate(from, to, p2, contact.point);
            
            Vector.subtract(position, contact.point, contact.normal);
            contact.normal.divide(radius);
        }
    }

    contains (point) {
        return Vector.distSquared(this.position, point) < Math.pow(this.radius, 2);
    }

    getPoint (index) {
        return this.position;
    }
}