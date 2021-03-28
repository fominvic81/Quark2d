import { Vector } from './Vector';
import { Vertex } from './Vertex';
import { Decomp } from './Polydecomp';

/**
 * The 'Vertices' is the class for manipulating sets of vertices
 */

export class Vertices {

    /**
     * Creates a new set of vertices.
     * @param points Array of points
     * @returns A new set of points
     */
    static create (points: Array<Vector>): Array<Vertex> {
        const vertices: Array<Vertex> = [];

        let index: number = 0;
        for (const point of points) {
            const vertex = new Vertex(point.x, point.y, index);
            vertices.push(vertex);
            ++index;
        }

        return vertices;
    }

    /**
     * Creates array of normals and lengths of the given set of vertices.
     * @param vertices
     * @param normals [normals output]
     * @param lengths [lengths output]
     * @returns The object that contains normals and lengths of vertices
     */
    static normals (vertices: Array<Vector>, normals: Array<Vector> = [], lengths: Array<number> = []) {

        for (let i = 0; i < vertices.length; ++i) {
            const j = (i + 1) % vertices.length;
            const normal = new Vertex(vertices[i].x - vertices[j].x, vertices[i].y - vertices[j].y, i);
            normal.rotate90();
            const length = normal.length();
            normal.divide(length);

            lengths.push(length);
            normals.push(normal);
        }

        return {normals, lengths};
    }

    /**
     * Translates the given set of vertices by the given vector.
     * @param vertices
     * @param vector
     * @returns The vertices
     */
    static translate (vertices: Array<Vector>, vector: Vector): Array<Vector> {

        for (let i = 0; i < vertices.length; ++i) {
            Vector.add(vertices[i], vector);
        }
        return vertices;
    }

    /**
     * Rotates the given set of vertices by the given angle around the given point.
     * @param vertices
     * @param angle
     * @param point
     * @param output [output]
     * @returns The vertices
     */
    static rotate (vertices: Array<Vector>, angle: number, point: Vector = Vector.zero, output: Array<Vector> = vertices): Array<Vector> {

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        for (let i = 0; i < vertices.length; ++i) {
            const vertex = vertices[i];
            const outputVertex = output[i];
            const x = vertex.x - point.x;
            const y = vertex.y - point.y;

            outputVertex.x = x * cos - y * sin + point.x;
            outputVertex.y = x * sin + y * cos + point.y;
        }
        return output;
    }

    /**
     * Scales the given set of vertices.
     * @param vertices
     * @param scalar
     * @returns The vertices
     */
    static scale (vertices: Array<Vector>, scalar: number): Array<Vector> {
        for (let i = 0; i < vertices.length; ++i) {
            vertices[i].scale(scalar);
        }

        return vertices;
    }

    /**
     * Returns the area of the given set of vertices.
     * @param vertices
     * @returns The area of the given set of vertices
     */
    static area (vertices: Array<Vector>): number {
        let area = 0;
        let j = vertices.length - 1;

        for (let i = 0; i < vertices.length; ++i) {
            area += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
            j = i;
        }

        return area / 2;
    }

    /**
     * Returns the inertia of the given set of vertices.
     * @param vertices
     * @returns The inertia of the given set of vertices
     */
    static inertia (vertices: Array<Vector>): number {
        let numerator: number = 0;
        let denominator: number = 0;

        for (let i = 0; i < vertices.length; ++i) {
            const j: number = (i + 1) % vertices.length;
            const cross: number = Math.abs(
                Vector.cross(vertices[j],
                vertices[i])
            );
            numerator += cross * (
                Vector.dot(vertices[j], vertices[j]) +
                Vector.dot(vertices[j], vertices[i]) +
                Vector.dot(vertices[i], vertices[i])
            );
            denominator += cross;
        }

        return (numerator / denominator) / 6;
    }

    /**
     * Returns the centroid of the given set of vertices.
     * @param vertices
     * @returns The centroid of the given set of vertices
     */
    static center (vertices: Array<Vector>): Vector {
        const center: Vector = new Vector();

        for (let i = 0; i < vertices.length; ++i) {
            const j = (i + 1) % vertices.length;
            const cross: number = Vector.cross(vertices[i], vertices[j]);
            const temp: Vector = Vector.add(vertices[i], vertices[j], Vector.temp[0]).scale(cross);
            Vector.add(center, temp);
        }

        center.divide(6 * Vertices.area(vertices));

        return center;
    }

    /**
     * Returns true if the given set of vertices contains the given point and false if not.
     * @param vertices
     * @param point
     * @returns True if the given set of vertices contains the given point and false if not
     */
    static contains (vertices: Array<Vector>, point: Vector): boolean {
        for (let i = 0; i < vertices.length; ++i) {
            const vertex = vertices[i];
            const nextVertex = vertices[(i + 1) % vertices.length];
            if ((point.x - vertex.x) * (nextVertex.y - vertex.y) + (point.y - vertex.y) * (vertex.x - nextVertex.x) > 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Returns true if the given set of vertices is a convex polygon (vertices must be in the clockwise winding).
     * @param vertices
     * @returns Еrue if the given set of vertices is a convex polygon (vertices must be in the clockwise winding)
     */
    static isConvex (vertices: Array<Vector>): boolean | undefined {
        // http://paulbourke.net/geometry/polygonmesh/
        // Copyright (c) Paul Bourke (use permitted)
        let flag = 0;

        if (vertices.length < 3) {
            return undefined;
        }

        for (let i = 0; i < vertices.length; ++i) {
            const j = (i + 1) % vertices.length;
            const k = (i + 2) % vertices.length;

            const v1 = vertices[i];
            const v2 = vertices[j];
            const v3 = vertices[k];

            const cross = Vector.cross(Vector.subtract(v2, v1, Vector.temp[0]), Vector.subtract(v3, v1, Vector.temp[1]))

            if (cross < 0) {
                flag |= 1;
            } else if (cross > 0) {
                flag |= 2;
            }

            if (flag === 3) {
                return false;
            }
        }

        if (flag !== 0) {
            return true;
        } else {
            return undefined;
        }

    }

    /**
     * Decomposes the given set of vertices using the poly-decomp.js(https://github.com/schteppe/poly-decomp.js).
     * @param vertices
     * @param removeCollinearPoints
     * @param minArea
     * @returns The array of sets of vertices
     */
    static decomp (vertices: Array<Vector>, removeCollinearPoints: boolean = true, minArea: number = 0): Array<Array<Vertex>> {
        
        const poly = vertices.map((vertex: Vector) => [vertex.x, vertex.y]);
        Decomp.makeCCW(poly);

        if (Vertices.isConvex(vertices)) {
            const part = Vertices.create(poly.map((vertex: Array<number>) => new Vector(vertex[0], vertex[1])));
            return [part];
        } else {
            
            const parts = [];
            const decomposed = Decomp.quickDecomp(poly, [], [], [], 25, 100, 0);

            for (const p of decomposed) {
                if (removeCollinearPoints) {
                    Decomp.removeCollinearPoints(p, 0.01);
                }
                const part = Vertices.create(p.map((vertex: Array<number>) => new Vector(vertex[0], vertex[1])));
                if (Math.abs(Vertices.area(part)) > minArea) {
                    parts.push(part);
                }
            }

            return parts;

        }
    }

    /**
     * Returns the convex hull of the given set of vertices.
     * @param vertices
     * @returns The convex hull of the given set of vertices
     */
    static hull (vertices: Array<Vector>) {
        const upper = [];
        const lower = []; 

        const verts = [...vertices];

        verts.sort((vertexA, vertexB) => (vertexA.x - vertexB.x || vertexA.y - vertexB.y));

        for (const vertex of verts) {

            while (lower.length >= 2 && Vector.side(lower[lower.length - 1], lower[lower.length - 2], vertex)) lower.pop();

            lower.push(vertex);
        }

        for (let i = verts.length - 1; i >= 0; --i) {
            const vertex = verts[i];

            while (upper.length >= 2 && Vector.side(upper[upper.length - 1], upper[upper.length - 2], vertex)) upper.pop();

            upper.push(vertex);
        }

        upper.pop();
        lower.pop();

        return upper.concat(lower);
    }
}