import { Shape } from './Shape';
import { Vector } from '../../math/Vector';

export class AAB extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'aab'
        this.type = Shape.AAB;
        this.width = options.width || 1;
        this.height = options.height || 1;

        this.updateArea();

        this.inertia = Infinity;

        this.createVertices();

    }

    createVertices () {
        this.vertices = [];

        this.vertices.push(new Vector(-this.width / 2, -this.height / 2));
        this.vertices.push(new Vector(this.width / 2, -this.height / 2));
        this.vertices.push(new Vector(this.width / 2, this.height / 2));
        this.vertices.push(new Vector(-this.width / 2, this.height / 2));

        this.worldVertices = [];

        for (let i = 0; i < 4; ++i) {
            this.worldVertices.push(new Vector());
            this.worldVertices[i].index = i;
            this.vertices[i].index = i;
        }
    }

    getWorldVertices () {
        const position = this.getWorldPosition();
        for (let i = 0; i < this.vertices.length; ++i) {
            Vector.add(this.vertices[i], position, this.worldVertices[i]);
        }
        return this.worldVertices;
    }

    project (vector) {
        const worldVertices = this.getWorldVertices();
        const min = Vector.dot(worldVertices[0], vector);
        const projection = {
            min,
            max: min,
        };

        for (const vertex of worldVertices) {
            const dot = Vector.dot(vertex, vector);

            if (dot > projection.max) { 
                projection.max = dot; 
            } else if (dot < projection.min) { 
                projection.min = dot; 
            }
        }

        return projection;
    }

    projectOnAxisX () {
        return {
            min: this.getWorldPosition().x - this.width / 2,
            max: this.getWorldPosition().x + this.width / 2,
        };
    }

    projectOnAxisY () {
        return {
            min: this.getWorldPosition().y - this.height / 2,
            max: this.getWorldPosition().y + this.height / 2,
        };
    }

    getWorldAngle () {
        return 0;
    }

    updateArea () {
        this.area = this.width * this.height;
        return this.area;
    }
    
    updateInertia () {
        this.inertia = (Math.pow(this.width, 2) + Math.pow(this.height, 2)) / 12;
        return this.inertia;
    }

    updateBounds () {
        Vector.set(this.bounds.min,
            -this.width / 2, -this.height / 2,
        );
        Vector.set(this.bounds.max,
            this.width / 2, this.height / 2,
        );
        this.bounds.translate(this.getWorldPosition());
        return this.bounds;
    }
}