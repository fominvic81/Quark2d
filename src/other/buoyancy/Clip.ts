import { Convex } from '../../body/shapes/Convex';
import { Shape, ShapeType } from '../../body/shapes/Shape';
import { Vector } from '../../math/Vector';


const intersection = (start1: Vector ,end1: Vector, start2: Vector, end2: Vector): Vector => {
    const deltaX1 = end1.x - start1.x;
    const deltaY1 = end1.y - start1.y;
    const deltaX2 = end2.x - start2.x;
    const deltaY2 = end2.y - start2.y;

    const deltaStartX = start1.y - start2.y;
    const deltaStartY = start1.x - start2.x;

    const determinant = deltaX1 * deltaY2 - deltaX2 * deltaY1;

    return Vector.interpolate(start1, end1, (deltaX2 * deltaStartX - deltaY2 * deltaStartY) / determinant, new Vector());
}

export const clip = (shapeA: Convex, shapeB: Convex) => {
    const polygonA = shapeA.vertices;
    let prevA: Vector = polygonA[polygonA.length - 1];
    let prevB: Vector;

    let output: Vector[] = shapeB.vertices;

    for (const pointA of polygonA) {
        const s = output;
        output = [];
        prevB = s[s.length - 1];
        for (const pointB of s) {
            if (Vector.side(prevA, pointA, pointB)) {
                if (!Vector.side(prevA, pointA, prevB)) {
                    output.push(intersection(prevA, pointA, prevB, pointB));
                }
                output.push(pointB);
            } else if (Vector.side(prevA, pointA, prevB)) {
                output.push(intersection(prevA, pointA, prevB, pointB));
            }
            prevB = pointB;
        }
        prevA = pointA;
    }
    return output;
}