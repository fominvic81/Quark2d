import { Shape, ShapeOptions, ShapeType } from './Shape';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';
import { Vertex } from '../../math/Vertex';
import { Intersection } from '../../collision/ray/Intersection';

export interface ConvexOptions extends ShapeOptions {
    vertices?: Vector[];
}

/**
 * The 'Convex' is convex polygon. The 'Convex' is described by the set of points.
 */

export class Convex extends Shape {
    type: number = ShapeType.CONVEX;
    vertices: Vertex[];
    deltaVertices: Vertex[];
    normals: Vertex[] = [];
    lengths: number[] = [];

    private static DEFAULT_VERTICES = [new Vector(-1, -1), new Vector(1, -1), new Vector(1, 1), new Vector(-1, 1)];

    constructor (options: ConvexOptions = {}) {
        super(options);

        const vertices = options.vertices ?? Convex.DEFAULT_VERTICES;

        this.vertices = Vertices.create(vertices);
        this.deltaVertices = Vertices.create(vertices);

        Vertices.normals(this.vertices, this.normals, this.lengths);

        this.updateArea();
        this.updateCenterOfMass();
        this.updateInertia();
    }

    /**
     * Returns index of the farthest vertex of convex in the given direction.
     * @param vector
     * @returns Index of the farthest vertex of convex in the given direction
     */
    project (vector: Vector) {
        const vertices = this.vertices;

        let max = Vector.dot(vertices[0], vector);
        let index = 0;

        const l = vertices.length - 1;
        const ld = Vector.dot(vertices[l], vector);

        if (ld === max) index = l;

        for (let i = 1; i < l; ++i) {
            const vertex = vertices[i];
            const dot = Vector.dot(vertex, vector);

            if (dot > max) {
                max = dot;
                index = vertex.index;
            }
        }

        if (ld > max) return l;

        return index;
    }

    /**
     * Translates the shape by the given vector.
     * @param vector
     */
    translate (vector: Vector) {
        this.position.add(vector);
        Vertices.translate(this.vertices, vector);
    }

    /**
     * Rotates the shape by the given angle.
     * @param angle
     */
    rotate (angle: number) {
        Vertices.rotate(this.vertices, angle, this.position);
        Vertices.rotate(this.normals, angle);
        Vertices.rotate(this.deltaVertices, angle);
    }

    /**
     * Updates the area of the shape.
     * @returns The area
     */
    updateArea () {
        this.area = Vertices.area(this.deltaVertices);

        for (const length of this.lengths) {
            this.area += length * this.radius;
        }

        this.area += Math.PI * Math.pow(this.radius, 2);

        return this.area;
    }

    /**
     * Updates the inertia of the shape.
     * @returns The inertia
     */
    updateInertia () {
        this.inertia = Vertices.inertia(this.deltaVertices);

        const radiusSquared = Math.pow(this.radius, 2);
        const inverseArea = 1/this.area;

        const vertex = Vector.temp[0];
        for (const v of this.vertices) {
            Vector.subtract(v, this.position, vertex);
            const vertex2 = Vector.subtract(this.vertices[(v.index + 1) % this.vertices.length], this.position, Vector.temp[1]);

            const length = this.lengths[v.index];
            const normal = this.normals[v.index];

            const point = Vector.interpolate(vertex, vertex2, 0.5, Vector.temp[2]);
            point.add(normal.scale(this.radius * 0.5, Vector.temp[3]));

            const areaFraction = length * this.radius * inverseArea;
            const inertia = (Math.pow(length, 2) + radiusSquared) / 12;
            const distSquared = point.lengthSquared();

            this.inertia += (inertia + distSquared) * areaFraction;
        }

        for (const v of this.vertices) {
            Vector.subtract(v, this.position, vertex);
            const n1 = this.normals[v.index];
            const n2 = this.normals[(v.index - 1 + this.normals.length) % this.normals.length];

            const sin = Vector.cross(n2, n1);
            const cos = Vector.dot(n2, n1);
            const angle = Math.atan2(sin, cos);

            const areaFraction = radiusSquared * angle * 0.5 * inverseArea;

            const inertia = radiusSquared / 2;
            const distSquared = vertex.lengthSquared();

            this.inertia += (inertia + distSquared) * areaFraction;
        }

        return this.inertia;
    }

    /**
     * Updates the aabb of the shape.
     * @returns The aabb
     */
    updateAABB () {
        this.aabb.fromVertices(this.vertices);
        this.aabb.minX -= this.radius;
        this.aabb.minY -= this.radius;
        this.aabb.maxX += this.radius;
        this.aabb.maxY += this.radius;
        return this.aabb;
    }

    /**
     * Updates the centroid of the shape.
     */
    updateCenterOfMass () {
        const center = Vertices.center(this.vertices);

        center.clone(this.position);

        this.updateInertia();
    }

    raycast (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {
        const vertices = this.vertices;
        const normals = this.normals;

        let contact = intersection.contacts[intersection.contactsCount];

        let prevVertex = vertices[vertices.length - 1];
        for (const vertex of vertices) {


            const point = Vector.lineLineIntersection(prevVertex, vertex, from, to, contact.point);
            if (point) {

                normals[prevVertex.index].clone(contact.normal);
                if (Vector.dot(delta, contact.normal) > 0) {
                    contact.normal.neg();
                }

                intersection.contactsCount += 1;
                contact = intersection.contacts[intersection.contactsCount];

            }
            if (intersection.contactsCount >= 2) break;

            prevVertex = vertex;
        }

        return intersection;
    }

    /**
     * Returns true if the shape contains the given point.
     * @param point
     * @returns True if the shape contains the given point
     */
    contains (point: Vector) {
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
        
        if (dot < 0) return v.lengthSquared() < Math.pow(this.radius, 2);
        if (dot > Math.pow(this.lengths[maxI], 2)) return Vector.subtract(point, p2, v).lengthSquared() < Math.pow(this.radius, 2);
        return true;
    }

    /**
     * Returns the point of the shape with given index.
     * @param index
     * @returns The point of the shape with given index
     */
    getPoint (index: number) {
        return this.vertices[index];
    }

    /**
     * Returns the normal of the shape with the given index.
     * @param index
     * @param output
     * @returns The normal of the shape with the given index
     */
    getNormal (index: number, output: Vector) {
        return this.normals[index].clone(output);
    }

    /**
     * Returns the farthest vertex in the given direction and its index.
     * @param vector
     */
    support (vector: Vector) {
        const index = this.project(vector);
        return this.vertices[index];
    }
}