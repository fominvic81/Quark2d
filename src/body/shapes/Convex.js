import { Shape } from './Shape';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';

export class Convex extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'convex'
        this.type = Shape.CONVEX;
        this.vertices = [];

        if (options.vertices) {
            for (const vertex of options.vertices) {
                this.vertices.push(Vector.clone(vertex));
            }
        } else {
            this.vertices.push(new Vector(-1, -1));
            this.vertices.push(new Vector(1, -1));
            this.vertices.push(new Vector(1, 1));
            this.vertices.push(new Vector(-1, 1));
        }

        this.updateArea();
        if (this.area <= 0) {
            this.area = -this.area;
            this.vertices.reverse();
        }

        this.updateCenterOfMass();

        this.updateVertices();

        this.createNormals();


        if (!this.inertia) {
            this.inertia = this.updateInertia();
        }
    }

    updateVertices () {
        this.worldVertices = [];
        for (let i = 0; i < this.vertices.length; ++i) {
            this.worldVertices.push(Vector.clone(this.vertices[i]));
            this.vertices[i].index = i;
            this.worldVertices[i].index = i;
        }
    }

    getWorldVertices () {
        this.getWorldPosition();
        for (let i = 0; i < this.vertices.length; ++i) {
            Vector.rotate(this.vertices[i], this.getWorldAngle(), this.worldVertices[i]);
            Vector.add(this.worldVertices[i], this.worldPosition);
        }
        return this.worldVertices;
    }

    createNormals () {
        this.allNormals = [];
        const normals = {};

        for (let i = 0; i < this.vertices.length; ++i) {
            const j = (i + 1) % this.vertices.length;
            const normal = Vector.subtract(this.vertices[i], this.vertices[j], new Vector());
            Vector.rotate90(normal);
            Vector.normalise(normal);
            normal.index = i;

            this.allNormals.push(normal);

            let gradient = normal.y === 0 ? Infinity : normal.x / normal.y; // if normal.y === 0, then always positive number(Infinity)
            normals[gradient.toFixed(2)] = normal;
            
        }

        this.normals = Object.values(normals);

        for (let i = 0; i < this.normals.length; ++i) {
            const index = this.normals[i].index;
            this.normals[i] = Vector.clone(this.normals[i]);
            this.normals[i].index = index;
        }
        
        this.worldNormals = [];
        
        for (const normal of this.normals) {
            const worldNormal = new Vector();
            worldNormal.index = normal.index;
            this.worldNormals.push(worldNormal);
        }
        
        this.allWorldNormals = [];

        for (const normal of this.allNormals) {
            const worldNormal = new Vector();
            worldNormal.index = normal.index;
            this.allWorldNormals.push(worldNormal);
        }
    }

    getWorldNormals (nonCollinear = true) {
        const worldAngle = this.getWorldAngle();
        const cos = Math.cos(worldAngle);
        const sin = Math.sin(worldAngle);

        const normals = nonCollinear ? this.normals : this.allNormals;
        const worldNormals = nonCollinear ? this.worldNormals : this.allWorldNormals;
        for (let i = 0; i < normals.length; ++i) {
            worldNormals[i].x = normals[i].x * cos - normals[i].y * sin;
            worldNormals[i].y = normals[i].x * sin + normals[i].y * cos;
        }
        return worldNormals;
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
        const worldVertices = this.getWorldVertices();
        const min = worldVertices[0].x;
        const projection = {
            min,
            max: min,
        };

        for (const vertex of worldVertices) {
            const dot = vertex.x;

            if (dot > projection.max) { 
                projection.max = dot; 
            } else if (dot < projection.min) { 
                projection.min = dot; 
            }
        }

        return projection;
    }

    projectOnAxisY () {
        const worldVertices = this.getWorldVertices();
        const min = worldVertices[0].y;
        const projection = {
            min,
            max: min,
        };

        for (const vertex of worldVertices) {
            const dot = vertex.y;

            if (dot > projection.max) { 
                projection.max = dot; 
            } else if (dot < projection.min) { 
                projection.min = dot; 
            }
        }

        return projection;
    }

    updateArea () {
        this.area = Vertices.area(this.vertices);
        return this.area;
    }
    
    updateInertia () {
        this.inertia = Vertices.inertia(this.vertices);
        return this.inertia;
    }

    updateBounds () {
        this.bounds.fromVertices(this.getWorldVertices());
        return this.bounds;
    }

    updateCenterOfMass () {
        const center = Vertices.center(this.vertices);

        Vector.add(this.position, center);

        for (const vertex of this.vertices) {
            Vector.subtract(vertex, center);
        }
    }
}