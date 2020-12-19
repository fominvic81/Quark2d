import { Shape } from './Shape';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';

export class Convex extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'convex'
        this.type = Shape.CONVEX;
        this.vertices = options.vertices || Convex.DEFAULT_VERTICES;

        this.worldVertices = new Vertices(this.vertices);
        this.vertices = new Vertices(this.vertices);

        this.updateArea();
        if (this.area <= 0) {
            this.area = -this.area;
            this.vertices.reverse();
        }

        this.updateCenterOfMass();

        this.createNormals();


        if (!this.inertia) {
            this.inertia = this.updateInertia();
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

        Vertices.normals(this.vertices, this.allNormals);

        for (const normal of this.allNormals) {
            let gradient = normal.y === 0 ? Infinity : normal.x / normal.y; // if normal.y === 0, then always positive number(Infinity)
            normals[gradient.toFixed(2)] = normal;
        }

        this.normals = Object.values(normals);
        
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

    raycast (intersection, from, to, delta) {
        const vertices = this.getWorldVertices();
        const normals = this.getWorldNormals(false);

        let contact = intersection.contacts[intersection.contactsCount];

        let prevVertex = vertices[vertices.length - 1];
        for (const vertex of vertices) {


            const point = Vector.lineLineIntersection(prevVertex, vertex, from, to, contact.point);
            if (point) {

                Vector.clone(normals[prevVertex.index], contact.normal);
                if (Vector.dot(delta, contact.normal) > 0) {
                    Vector.neg(contact.normal);
                }

                intersection.contactsCount += 1;
                contact = intersection.contacts[intersection.contactsCount];

            }
            if (intersection.contactsCount >= 2) break;

            prevVertex = vertex;
        }

        return intersection;
    }
}

Convex.DEFAULT_VERTICES = [new Vector(-1, -1), new Vector(1, -1), new Vector(1, 1), new Vector(-1, 1)];