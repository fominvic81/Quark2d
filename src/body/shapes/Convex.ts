import { Shape, ShapeOptions, ShapeType } from './Shape';
import { Vector } from '../../math/Vector';
import { Vertices } from '../../math/Vertices';
import { Vertex } from '../../math/Vertex';
import { Intersection } from '../../collision/ray/Intersection';
import { circleTest } from '../../collision/ray/CircleTest';
import { Settings } from '../../Settings';

export interface ConvexOptions extends ShapeOptions {
    /** Array of vertices of the shape. */
    vertices?: Vector[];
    /** An initial angle of the shape */
    angle?: number;
}

/**
 * The 'Convex' is convex polygon. The 'Convex' is described by the set of points.
 */

export class Convex<UserData = any> extends Shape {
    type: number = ShapeType.CONVEX;
    /** Array of vertices of the shape. */
    vertices: Vertex[];
    /** Array of normals of the shape. */
    normals: Vertex[] = [];
    /** Array of lengths of the edges of the shape. */
    lengths: number[] = [];

    private static DEFAULT_VERTICES = [new Vector(-1, -1), new Vector(1, -1), new Vector(1, 1), new Vector(-1, 1)];

    constructor (options: ConvexOptions = {}, userData?: UserData) {
        super(options, userData);

        const vertices = options.vertices ?? Convex.DEFAULT_VERTICES;

        this.vertices = Vertices.create(vertices);

        Vertices.normals(this.vertices, this.normals, this.lengths);

        this.updateArea();
        this.getCenterOfMass(this.center);

        if (options.mass) this.setMass(options.mass);
        if (!options.mass || options.density) this.setDensity(options.density ?? Settings.defaultDensity);

        this.updateInertia();
        if (options.angle) this.rotate(options.angle);
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
            const dot = vertex.x * vector.x + vertex.y * vector.y;

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
        this.center.add(vector);
        Vertices.translate(this.vertices, vector);
    }

    /**
     * Rotates the shape by the given angle.
     * @param angle
     */
    rotate (angle: number) {
        this.rotateU(Math.cos(angle), Math.sin(angle));
    }
    
    rotateU(uX: number, uY: number) {
        Vertices.rotateAboutU(this.vertices, uX, uY, this.center);
        Vertices.rotateU(this.normals, uX, uY);
    }

    rotateAbout(angle: number, point: Vector) {
        this.rotateAboutU(Math.cos(angle), Math.sin(angle), point);
    }

    rotateAboutU(uX: number, uY: number, point: Vector) {
        this.center.rotateAboutU(uX, uY, point);
        Vertices.rotateAboutU(this.vertices, uX, uY, point);
        Vertices.rotateU(this.normals, uX, uY);
    }

    /**
     * Updates the area of the shape.
     * @returns The area
     */
    updateArea () {
        this.area = Vertices.area(this.vertices);

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
        const vertices: Vector[] = [];

        for (const vertex of this.vertices) {
            vertices.push(vertex.copy().subtract(this.center));
        }
        this.areaInertia = Vertices.inertia(vertices);

        const radiusSquared = Math.pow(this.radius, 2);
        const inverseArea = 1/this.area;

        const vertex = Vector.temp[0];
        for (const v of this.vertices) {
            Vector.subtract(v, this.center, vertex);
            const vertex2 = Vector.subtract(this.vertices[(v.index + 1) % this.vertices.length], this.center, Vector.temp[1]);

            const length = this.lengths[v.index];
            const normal = this.normals[v.index];

            const point = Vector.lerp(vertex, vertex2, 0.5, Vector.temp[2]);
            point.add(normal.clone(Vector.temp[3]).scale(this.radius * 0.5));

            const areaFraction = length * this.radius * inverseArea;
            const inertia = (Math.pow(length, 2) + radiusSquared) / 12;
            const distSquared = point.lengthSquared();

            this.areaInertia += (inertia + distSquared) * areaFraction;
        }

        for (const v of this.vertices) {
            Vector.subtract(v, this.center, vertex);
            const n1 = this.normals[v.index];
            const n2 = this.normals[(v.index - 1 + this.normals.length) % this.normals.length];

            const sin = Vector.cross(n2, n1);
            const cos = Vector.dot(n2, n1);
            const angle = Math.atan2(sin, cos);

            const areaFraction = radiusSquared * angle * 0.5 * inverseArea;

            const inertia = radiusSquared / 2;
            const distSquared = vertex.lengthSquared();

            this.areaInertia += (inertia + distSquared) * areaFraction;
        }

        this.inertia = this.areaInertia * this.mass;
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

    raycast (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {
        const vertices = this.vertices;
        const normals = this.normals;

        let prevVertex = vertices[vertices.length - 1];
        for (const vertex of vertices) {

            const normal = normals[prevVertex.index];
            if (Vector.dot(delta, normal) < 0) {
                const fraction = Vector.lineSegmentsIntersectionFraction(
                    from,
                    to,
                    prevVertex,
                    vertex,
                );
                if (fraction) {
                    intersection.fraction = fraction;

                    normal.clone(intersection.normal);

                    intersection.point.x = from.x + fraction * delta.x;
                    intersection.point.y = from.y + fraction * delta.y;
                    return true;
                }
            }

            prevVertex = vertex;
        }

        return false;
    }

    raycastRadius (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {
        const vertices = this.vertices;
        const normals = this.normals;
        const r = this.radius;
        
        let t = Infinity;

        let prevVertex = vertices[vertices.length - 1];
        for (const vertex of vertices) {

            const normal = normals[prevVertex.index];
            if (Vector.dot(delta, normal) < 0) {
                const offset = normal.clone(Vector.temp[0]).scale(r);
                const fraction = Vector.lineSegmentsIntersectionFraction(
                    from,
                    to,
                    Vector.add(prevVertex, offset, Vector.temp[1]),
                    Vector.add(vertex, offset, Vector.temp[2]),
                );

                if (fraction) {
                    t = fraction;
                    intersection.fraction = fraction;

                    normal.clone(intersection.normal);

                    intersection.point.x = from.x + fraction * delta.x;
                    intersection.point.y = from.y + fraction * delta.y;
                    break;
                }
            }

            prevVertex = vertex;
        }
        for (const vertex of vertices) {

            const fraction = circleTest(from, delta, vertex, r);
            if (fraction < t) {
                t = fraction;
                intersection.fraction = fraction;

                intersection.point.x = from.x + fraction * delta.x;
                intersection.point.y = from.y + fraction * delta.y;

                Vector.subtract(intersection.point, vertex, intersection.normal).divide(r);
            }
        }

        return t !== Infinity;
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
        return this.vertices[this.project(vector)];
    }

    getCenterOfMass (output: Vector) {
        return Vertices.center(this.vertices).clone(output);
    }
}