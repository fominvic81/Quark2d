import { Shape } from './Shape';
import { Vector } from '../../math/Vector';

export class Circle extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'circle'
        this.type = Shape.CIRCLE;
        this.radius = options.radius || 0.5;

        this.updateArea();

        if (!this.inertia) {
            this.inertia = this.updateInertia();
        }
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
        Vector.set(this.bounds.min,
            -this.radius, -this.radius,
        );
        Vector.set(this.bounds.max,
            this.radius, this.radius,
        );
        this.bounds.translate(this.getWorldPosition());
        return this.bounds;
    }

    raycast (intersection, from, to, delta) {

        const position = this.getWorldPosition();
        const radius = this.radius;

        const posDelta = Vector.subtract(from, position, Vector.temp[0]);

        const a = Vector.lengthSquared(delta);
        const b = 2 * Vector.dot(delta, posDelta);
        const c = Vector.lengthSquared(posDelta) - Math.pow(radius, 2);
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
            Vector.divide(contact.normal, radius);
        }

        if (p2 >= 0 && p2 <= 1) {
            const contact = intersection.contacts[intersection.contactsCount];
            ++intersection.contactsCount;

            Vector.interpolate(from, to, p2, contact.point);
            
            Vector.subtract(position, contact.point, contact.normal);
            Vector.divide(contact.normal, radius);
        }

    }
}