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
        this.projection = {};
        this.axisProjection = {};
        this.projections = [];

        this.updateArea();

        this.updateCenterOfMass();

        this.createNormals();

        this.createProjections();

        if (!this.inertia) {
            this.inertia = this.updateInertia();
        }
    }

    getWorldVertices () {
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
            const worldNormal = Vector.clone(normal);
            worldNormal.index = normal.index;
            this.worldNormals.push(worldNormal);
        }
        
        this.allWorldNormals = [];

        for (const normal of this.allNormals) {
            const worldNormal = Vector.clone(normal);
            worldNormal.index = normal.index;
            this.allWorldNormals.push(worldNormal);
        }
    }

    getWorldNormals (nonCollinear = true) {
        const worldNormals = nonCollinear ? this.worldNormals : this.allWorldNormals;
        return worldNormals;
    }

    createProjections () {
        for (const normal of this.allWorldNormals) {
            this.projections[normal.index] = this.project(normal, {});
            const dot = Vector.dot(this.worldPosition, normal);
            this.projections[normal.index].value -= dot;
        }
    }

    projectOnOwn (index) {
        const dot = Vector.dot(this.worldPosition, this.allWorldNormals[index]);
        const projection = this.projection;

        projection.value = this.projections[index].value + dot;
        projection.index = this.projections[index].index;

        return projection;
    }

    project (vector, output = this.projection) {
        const worldVertices = this.getWorldVertices();
        let dot = Vector.dot(worldVertices[0], vector);
        const projection = output;

        projection.value = dot;
        projection.index = 0;

        const ld = Vector.dot(worldVertices[worldVertices.length - 1], vector);

        if (Math.abs(ld - dot) < 0.000001) {
            projection.index = worldVertices.length - 1;
        }

        for (let i = 1; i < worldVertices.length; ++i) {
            const vertex = worldVertices[i];
            dot = Vector.dot(vertex, vector);

            if (dot > projection.value + 0.000001) {
                projection.value = dot;
                projection.index = vertex.index;
            }
        }

        return projection;
    }

    projectOnAxisX () {
        const worldVertices = this.getWorldVertices();
        const min = worldVertices[0].x;
        const projection = this.axisProjection;
        projection.min = min;
        projection.minIndex = 0;
        projection.max = min;
        projection.maxIndex = 0;

        for (const vertex of worldVertices) {
            const dot = vertex.x;

            if (dot > projection.max) { 
                projection.max = dot; 
                projection.maxIndex = vertex.index;
            } else if (dot < projection.min) { 
                projection.min = dot; 
                projection.minIndex = vertex.index;
            }
        }

        return projection;
    }

    projectOnAxisY () {
        const worldVertices = this.getWorldVertices();
        const min = worldVertices[0].y;
        const projection = this.axisProjection;
        projection.min = min;
        projection.minIndex = 0;
        projection.max = min;
        projection.maxIndex = 0;

        for (const vertex of worldVertices) {
            const dot = vertex.y;

            if (dot > projection.max) { 
                projection.max = dot; 
                projection.maxIndex = vertex.index;
            } else if (dot < projection.min) { 
                projection.min = dot; 
                projection.minIndex = vertex.index;
            }
        }

        return projection;
    }

    translate (offset) {
        Vector.add(this.worldPosition, offset);
        Vertices.translate(this.worldVertices, offset);
    }

    rotate (angle) {
        Vertices.rotate(this.worldVertices, angle, this.worldPosition);
        Vertices.rotate(this.worldNormals, angle);
        Vertices.rotate(this.allWorldNormals, angle);
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
        this.bounds.min.x -= this.radius;
        this.bounds.min.y -= this.radius;
        this.bounds.max.x += this.radius;
        this.bounds.max.y += this.radius;
        return this.bounds;
    }

    updateCenterOfMass () {
        const center = Vertices.center(this.worldVertices);

        Vector.clone(center, this.worldPosition);
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