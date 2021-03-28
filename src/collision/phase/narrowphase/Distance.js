import { ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';

const MAX_GJK_ITERATIONS = 30;
const MAX_EPA_ITERATIONS = 40;
const INIT_DIR = new Vector(1, 0);

class SupportPoint {
    constructor(shapeA, shapeB, dir) {
        const supportA = supportPoint(shapeA, dir);
        const supportB = supportPoint(shapeB, dir.neg(Vector.temp[0]));

        const pointA = supportA[0];
        const pointB = supportB[0];

        this.indexA = supportA[1];
        this.indexB = supportB[1];
        this.index = (this.indexA & 0xffff) << 16 | (this.indexB & 0xffff);

        this.point = new Vector(pointA.x - pointB.x, pointA.y - pointB.y);
    }
}

const supportPoint = (shape, dir) => {
    switch (shape.type) {
        case ShapeType.CIRCLE:
            return; // TODO
        case ShapeType.CONVEX:
            return convexSupportPoint(shape, dir);
        case ShapeType.EDGE:
            return edgeSupportPoint(shape, dir);
    }
}

const convexSupportPoint = (convex, dir) => {
    const index = convex.project(dir);
    return [convex.vertices[index], index];
}

const edgeSupportPoint = (edge, dir) => {
    const index = edge.project(dir);
    return [index ? edge.end : edge.start, index];
}

const pts = (p1, p2) => {
    const t = Vector.zeroT(p1.point, p2.point);

    if (t === -1) {
        return [p1];
    } else if (t === 1) {
        return [p2];
    } else {
        return [p2, p1];
    }
}

export const GJK = (shapeA, shapeB) => {

    const dir = Vector.temp[1];

    let iterations = 0;;
    let p1 = new SupportPoint(shapeA, shapeB, INIT_DIR);
    let p2 = new SupportPoint(shapeA, shapeB, INIT_DIR.neg(dir));

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

        const support = new SupportPoint(shapeA, shapeB, dir);

        if (Vector.zeroSide(p1.point, support.point) && Vector.zeroSide(support.point, p2.point)) {
            return EPA([p1, p2, support], shapeA, shapeB);
        } else {
            if (Vector.dot(support.point, dir) <= Math.max(Vector.dot(p1.point, dir), Vector.dot(p2.point, dir))) {
                return pts(p1, p2);
            } else {
                if (Vector.distSquaredToZero(p1.point, support.point) < Vector.distSquaredToZero(p2.point, support.point)) {
                    p2 = support;
                } else {
                    p1 = support;
                }
            }
        }

        ++iterations;
        if (iterations > MAX_GJK_ITERATIONS) {
            console.warn('Too many GJK iterations');
            return false;
        }
    }
}

export const EPA = (points, shapeA, shapeB) => {

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

        const p1 = points[minI];
        const p2 = points[minJ];

        if (iterations > MAX_EPA_ITERATIONS) {
            console.warn('Too many EPA iterations');
            return [p1, p2];
        }

        const p = new SupportPoint(shapeA, shapeB, Vector.subtract(p2.point, p1.point, Vector.temp[1]).rotate90());

        if (p1.index === p.index || p2.index === p.index) {
            return [p1, p2];
        } else {
            const points2 = [p];

            for (let i = 0; i < points.length; ++i) {
                let index = (minI + 1 + i) % points.length;

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