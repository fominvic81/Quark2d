import { Shape, ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';
import { Vertex } from '../../../math/Vertex';
import { Settings } from '../../../Settings';

const INIT_DIR: Vector = new Vector(1, 0);

export class SupportPoint {
    pointA: Vertex = new Vertex(0, 0, 0);
    pointB: Vertex = new Vertex(0, 0, 0);
    indexA: number = 0;
    indexB: number = 0;
    index: number = 0;
    point: Vector = new Vector();

    compute (shapeA: Shape, shapeB: Shape, dir: Vector) {
        const supportA = shapeA.support(dir);
        const supportB = shapeB.support(dir.neg(Vector.temp[0]));

        this.pointA = supportA;
        this.pointB = supportB;

        this.indexA = supportA.index;
        this.indexB = supportB.index;
        this.index = (this.indexA & 0xffff) << 16 | (this.indexB & 0xffff);

        this.point = new Vector(this.pointA.x - this.pointB.x, this.pointA.y - this.pointB.y);
    }

    clone (output: SupportPoint) {
        output.pointA = this.pointA;
        output.pointB = this.pointB;
        output.indexA = this.indexA;
        output.indexB = this.indexB;
        output.index = this.index;
        this.point.clone(output.point);
    }
}

const GJK_Temp: SupportPoint[] = [new SupportPoint(), new SupportPoint(), new SupportPoint()];
const EPA_Temp: SupportPoint[] = [];

for (let i = 0; i <= Settings.maxEPAIterations; ++i) {
    EPA_Temp.push(new SupportPoint());
}

export const GJK = (shapeA: Shape, shapeB: Shape, useEpa: boolean, output: SupportPoint[]): boolean => {

    const maxIterations = Settings.maxGJKIterations;

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
            if (useEpa) {
                EPA([p1, p2, support], shapeA, shapeB, output);
                return true;
            }
            output.push(p1, p2, support);
            return true;
        } else {
            if (Vector.dot(support.point, dir) <= Math.max(Vector.dot(p1.point, dir), Vector.dot(p2.point, dir))) {
                const t = Vector.zeroT(p1.point, p2.point);

                if (t === -1) {
                    output.push(p1);
                } else if (t === 1) {
                    output.push(p2);
                } else {
                    output.push(p2, p1);
                }
                return true;
            } else {
                if (Vector.distSquaredToZero(p1.point, support.point) < Vector.distSquaredToZero(p2.point, support.point)) {
                    support.clone(p2);
                } else {
                    support.clone(p1);
                }
            }
        }

        ++iterations;
        if (iterations > maxIterations) {
            console.warn('Too many GJK iterations');
            return false;
        }
    }
}

export const EPA = (points: SupportPoint[], shapeA: Shape, shapeB: Shape, output: SupportPoint[]): void => {

    const maxIterations = Settings.maxEPAIterations;

    let iterations = 0;

    while (true) {
        ++iterations;

        let minDist = Infinity;
        let minI: number;
        let minJ: number;

        for (let j = 0, i = points.length - 1; j < points.length; i = j, ++j) {
            const dist = Vector.distSquaredToZero(points[i].point, points[j].point);

            if (dist < minDist) {
                minDist = dist;
                minI = i;
                minJ = j;
            }
        }

        const p1 = points[minI!];
        const p2 = points[minJ!];

        if (iterations > maxIterations) {
            console.warn('Too many EPA iterations');
            output.push(p1, p2);
            return;
        }

        const p = EPA_Temp[iterations];
        p.compute(shapeA, shapeB, Vector.subtract(p2.point, p1.point, Vector.temp[1]).rotate90());

        if (p1.index === p.index || p2.index === p.index) {
            output.push(p1, p2);
            return;
        } else {
            const points2 = [p];

            for (let i = 0; i < points.length; ++i) {
                let index = (minI! + 1 + i) % points.length;

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

    const points: SupportPoint[] = [];

    if (!GJK(shapeA, shapeB, true, points)) return;

    if (points.length === 1) {
        const vertex1 = points[0].pointA;
        const vertex2 = points[0].pointB;

        const normal = new Vector();

        Vector.subtract(vertex2, vertex1, normal);
        const length = normal.length();

        normal.divide(length);

        return {a: [vertex1], b: [vertex2], distance: length, normal};
    } else {
        if (points[0].pointA === points[1].pointA) {
            const normal = shapeB.getNormal(points[1].indexB, new Vector());
            return {
                a: [points[0].pointA],
                b: [points[0].pointB, points[1].pointB],
                distance: Vector.dot(normal, points[0].point),
                normal,
            };
        } else {
            const normal = shapeA.getNormal(points[1].indexA, new Vector());
            return {
                a: [points[0].pointA, points[1].pointA],
                b: [points[0].pointB],
                distance: -Vector.dot(normal, points[0].point),
                normal,
            };
        }
    }
}