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
}