import { Convex } from '../../../body/shapes/Convex';
import { Edge } from '../../../body/shapes/Edge';
import { Shape, ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';

const MAX_GJK_ITERATIONS: number = 30;
const MAX_EPA_ITERATIONS: number = 40;
const INIT_DIR: Vector = new Vector(1, 0);

export class SupportPoint {
    indexA: number = 0;
    indexB: number = 0;
    index: number = 0;
    point: Vector = new Vector();

    compute (shapeA: Shape, shapeB: Shape, dir: Vector) {
        const supportA = supportPoint(shapeA, dir);
        const supportB = supportPoint(shapeB, dir.neg(Vector.temp[0]));

        const pointA = <Vector>supportA[0];
        const pointB = <Vector>supportB[0];

        this.indexA = supportA[1];
        this.indexB = supportB[1];
        this.index = (this.indexA & 0xffff) << 16 | (this.indexB & 0xffff);

        this.point = new Vector(pointA.x - pointB.x, pointA.y - pointB.y);
    }

    clone (p: SupportPoint) {
        p.indexA = this.indexA;
        p.indexB = this.indexB;
        p.index = this.index;
        this.point.clone(p.point);
    }
}

const GJK_Temp: SupportPoint[] = [new SupportPoint(), new SupportPoint(), new SupportPoint()];
const EPA_Temp: SupportPoint[] = [];

for (let i = 0; i <= MAX_EPA_ITERATIONS; ++i) {
    EPA_Temp.push(new SupportPoint());
}

const supportPoint = (shape: Shape, dir: Vector): [Vector, number] => {
    switch (shape.type) {
        case ShapeType.CIRCLE:
            return [shape.position, 0];
        case ShapeType.CONVEX:
            return convexSupportPoint(<Convex>shape, dir);
        case ShapeType.EDGE:
            return edgeSupportPoint(<Edge>shape, dir);
    }
    throw new Error();
}

const convexSupportPoint = (convex: Convex, dir: Vector): [Vector, number] => {
    const index = convex.project(dir);
    return [convex.vertices[index], index];
}

const edgeSupportPoint = (edge: Edge, dir: Vector): [Vector, number] => {
    const index = edge.project(dir);
    return [index ? edge.end : edge.start, index];
}

const pts = (p1: SupportPoint, p2: SupportPoint): SupportPoint[] => {
    const t = Vector.zeroT(p1.point, p2.point);

    if (t === -1) {
        return [p1];
    } else if (t === 1) {
        return [p2];
    } else {
        return [p2, p1];
    }
}

export const GJK = (shapeA: Shape, shapeB: Shape): SupportPoint[] => {

    const dir = Vector.temp[1];

    let iterations = 0;
    let p1 = GJK_Temp[0];
    let p2 = GJK_Temp[1];
    p1.compute(shapeA, shapeB, INIT_DIR);
    p2.compute(shapeA, shapeB, INIT_DIR.neg(dir));

    while (true) {

        if (Vector.zeroSide(p1.point, p2.point)) {
            const swap = p1;
            p1 = p2;
            p2 = swap;
        }

        const t = Vector.zeroT(p1.point, p2.point);
        if (-1 < t && t < 1) {
            Vector.subtract(p2.point, p1.point, dir).rotate270();
        } else {
            Vector.interpolateT(p1.point, p2.point, t, dir).neg();
        }

        const support = GJK_Temp[2];
        support.compute(shapeA, shapeB, dir);

        if (Vector.zeroSide(p1.point, support.point) && Vector.zeroSide(support.point, p2.point)) {
            return EPA([p1, p2, support], shapeA, shapeB);
        } else {
            if (Vector.dot(support.point, dir) <= Math.max(Vector.dot(p1.point, dir), Vector.dot(p2.point, dir))) {
                return pts(p1, p2);
            } else {
                if (Vector.distSquaredToZero(p1.point, support.point) < Vector.distSquaredToZero(p2.point, support.point)) {
                    support.clone(p2);
                } else {
                    support.clone(p1);
                }
            }
        }

        ++iterations;
        if (iterations > MAX_GJK_ITERATIONS) {
            console.warn('Too many GJK iterations');
            return [];
        }
    }
}

export const EPA = (points: SupportPoint[], shapeA: Shape, shapeB: Shape): SupportPoint[] => {

    let iterations = 0;

    while (true) {
        ++iterations;

        let minDist = Infinity;
        let minI;
        let minJ;

        for (let j = 0, i = points.length - 1; j < points.length; i = j, ++j) {
            const dist = Vector.distSquaredToZero(points[i].point, points[j].point);

            if (dist < minDist) {
                minDist = dist;
                minI = i;
                minJ = j;
            }
        }

        const p1 = points[<number>minI];
        const p2 = points[<number>minJ];

        if (iterations > MAX_EPA_ITERATIONS) {
            console.warn('Too many EPA iterations');
            return [p1, p2];
        }

        const p = EPA_Temp[iterations];
        p.compute(shapeA, shapeB, Vector.subtract(p2.point, p1.point, Vector.temp[1]).rotate90());

        if (p1.index === p.index || p2.index === p.index) {
            return [p1, p2];
        } else {
            const points2 = [p];

            for (let i = 0; i < points.length; ++i) {
                let index = (<number>minI + 1 + i) % points.length;

                const n0 = points2[points2.length - 1].point;
                const n1 = points[index].point;
                const n2 = points[(index + 1) % points.length].point;

                if (Vector.side(n0, n2, n1)) {
                    points2.push(points[index]);
                }
            }
            points = points2;
        }
    }
}

export const distance = (shapeA: Shape, shapeB: Shape) => {

    const points = GJK(shapeA, shapeB);

    if (!points.length) return;

    if (points.length === 1) {
        const vertex1 = shapeA.getPoint(points[0].indexA);
        const vertex2 = shapeB.getPoint(points[0].indexB);

        const normal = new Vector();

        Vector.subtract(vertex2, vertex1, normal);
        const length = normal.length();

        normal.divide(length);

        return {a: [vertex1], b: [vertex2], distance: length, normal};
    } else {
        if (points[0].indexA === points[1].indexA) {
            const normal = shapeB.getNormal(points[1].indexB, new Vector());
            return {
                a: [shapeA.getPoint(points[0].indexA)],
                b: [shapeB.getPoint(points[0].indexB), shapeB.getPoint(points[1].indexB)],
                distance: Vector.dot(normal, points[0].point),
                normal,
            };
        } else {
            const normal = shapeA.getNormal(points[1].indexA, new Vector());
            return {
                a: [shapeA.getPoint(points[0].indexA), shapeA.getPoint(points[1].indexA)],
                b: [shapeB.getPoint(points[0].indexB)],
                distance: -Vector.dot(normal, points[0].point),
                normal,
            };
        }
    }
}