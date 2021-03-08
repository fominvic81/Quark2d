import { Shape } from './Shape';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';

export class Convex extends Shape {

    constructor (options = {}) {
        super(options);

        this.label = 'convex'
        this.type = Shape.CONVEX;
        const vertices = options.vertices || Convex.DEFAULT_VERTICES;

        this.vertices = new Vertices(vertices);
        this.deltaVertices = new Vertices(vertices);
        this.projection = {};

        this.normals = [];
        this.lengths = [];
        Vertices.normals(this.vertices, this.normals, this.lengths);

        this.updateArea();
        this.updateCenterOfMass();

        if (!this.inertia) {
            this.inertia = this.updateInertia();
        }
    }

    project (vector, output = this.projection) {
        const vertices = this.vertices;
        let dot = Vector.dot(vertices[0], vector);

        output.value = dot;
        output.index = 0;

        const ld = Vector.dot(vertices[vertices.length - 1], vector);

        if (Math.abs(ld - dot) < 0.000001) {
            output.index = vertices.length - 1;
        }

        for (let i = 1; i < vertices.length; ++i) {
            const vertex = vertices[i];
            dot = Vector.dot(vertex, vector);

            if (dot > output.value + 0.000001) {
                output.value = dot;
                output.index = vertex.index;
            }
        }

        return output;
    }

    translate (offset) {
        Vector.add(this.position, offset);
        Vertices.translate(this.vertices, offset);
    }

    rotate (angle) {
        Vertices.rotate(this.vertices, angle, this.position);
        Vertices.rotate(this.normals, angle);
        Vertices.rotate(this.deltaVertices, angle);
    }

    updateArea () {
        this.area = Vertices.area(this.deltaVertices);

        for (const length of this.lengths) {
            this.area += length * this.radius;
        }

        this.area += Math.PI * Math.pow(this.radius, 2);

        return this.area;
    }

    updateInertia () {
        this.inertia = Vertices.inertia(this.deltaVertices);

        const radiusSquared = Math.pow(this.radius, 2);
        const inverseArea = 1/this.area;

        for (const vertex of this.deltaVertices) {
            const length = this.lengths[vertex.index];
            const normal = this.normals[vertex.index];

            const areaFraction = (length * this.radius) * inverseArea;
            const i = (length * length + radiusSquared) / 12;
            const distSquared = Math.pow(Vector.dot(vertex, normal) + this.radius * 0.5, 2);

            this.inertia += (i + distSquared) * areaFraction;
        }

        for (const vertex of this.deltaVertices) {
            const n1 = this.normals[vertex.index];
            const n2 = this.normals[(vertex.index + 1) % this.normals.length];

            const sin = Vector.cross(n1, n2);
            const cos = Vector.dot(n1, n2);

            const angle = Math.abs(Math.atan2(sin, cos));

            const areaFraction = (radiusSquared * angle * 0.5) * inverseArea;

            const i = radiusSquared / 2;
            const distSquared = Vector.lengthSquared(vertex);

            this.inertia += (i + distSquared) * areaFraction;
        }

        return this.inertia;
    }

    updateBounds () {
        this.bounds.fromVertices(this.vertices);
        this.bounds.min.x -= this.radius;
        this.bounds.min.y -= this.radius;
        this.bounds.max.x += this.radius;
        this.bounds.max.y += this.radius;
        return this.bounds;
    }

    updateCenterOfMass () {
        const center = Vertices.center(this.vertices);

        Vector.clone(center, this.position);
    }

    raycast (intersection, from, to, delta) {
        const vertices = this.vertices;
        const normals = this.normals;

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

    contains (point) {
        let maxDist = -Infinity;
        let maxI = 0;

        for (const vertex of this.vertices) {
            const normal = this.normals[vertex.index];

            const dist = Vector.dot(point, normal) - Vector.dot(vertex, normal);
            if (dist > this.radius) return false;
            if (dist > maxDist) {
                maxDist = dist;
                maxI = vertex.index;
            }
        }
        if (maxDist < 0) return true;

        const p1 = this.vertices[maxI];
        const p2 = this.vertices[(maxI + 1) % this.vertices.length];

        const v = Vector.subtract(point, p1, Vector.temp[0]);
        const delta = Vector.subtract(p2, p1, Vector.temp[1]);

        const dot = Vector.dot(v, delta);
        
        if (dot < 0) return Vector.lengthSquared(v) < Math.pow(this.radius, 2);
        if (dot > Math.pow(this.lengths[maxI], 2)) return Vector.lengthSquared(Vector.subtract(point, p2, v)) < Math.pow(this.radius, 2);
        return true;
    }

    getPoint (index) {
        return this.vertices[index];
    }

    getNormal (index, output) {
        return Vector.clone(this.normals[index], output);
    }
}

Convex.DEFAULT_VERTICES = [new Vector(-1, -1), new Vector(1, -1), new Vector(1, 1), new Vector(-1, 1)];