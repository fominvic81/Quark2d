import { Vector } from '../../../math/Vector';
import { ShapeType } from '../../../body/shapes/Shape';
import { Pair } from '../../pair/Pair';
import { Convex } from '../../../body/shapes/Convex';
import { Circle } from '../../../body/shapes/Circle';
import { Vertex } from '../../../math/Vertex';

export const ConvexVsCircle = (pair: Pair) => {

    const flipped: boolean = pair.shapeA.type === ShapeType.CONVEX;
    const convex: Convex = <Convex>(flipped ? pair.shapeA : pair.shapeB);
    const circle: Circle = <Circle>(flipped ? pair.shapeB : pair.shapeA);

    const vertices: Vertex[] = convex.vertices;
    const normals: Vertex[] = convex.normals;
    const circlePosition: Vector = circle.position;

    const radius: number = convex.radius + circle.radius;

    const closestPoint: Vector = Vector.temp[4];

    const temp1: Vector = Vector.temp[1];
    const temp2: Vector = Vector.temp[2];
    const temp3: Vector = Vector.temp[3];

    let maxDist: number = -Infinity;
    let normalIndex: number = 0;
    let vertex: boolean = false;

    for (const normal of normals) {

        const dot = Vector.dot(normal, Vector.subtract(circlePosition, vertices[normal.index], temp1));

        if (dot > maxDist) {
            normalIndex = normal.index;
            maxDist = dot;
        }
    }


    const point1: Vertex = vertices[normalIndex];

    if (Vector.dot(Vector.subtract(circlePosition, point1, temp1), normals[normalIndex]) > radius) {
        return;
    }

    const point2: Vertex = vertices[(normalIndex + 1) % vertices.length];

    const dot1: number = Vector.dot(Vector.subtract(circlePosition, point1, temp2), Vector.subtract(point2, point1, temp3));

    if (dot1 < 0) {

        point1.clone(closestPoint);
        vertex = true;

    } else {

        const dot2: number = Vector.dot(Vector.subtract(circlePosition, point2, temp2), Vector.subtract(point1, point2, temp3));

        if (dot2 < 0) {

            point2.clone(closestPoint);
            vertex = true;

        } else {

            normals[normalIndex].clone(pair.normal);
            if (!flipped) {
                pair.normal.neg();
            }

            Vector.subtract(circlePosition, normals[normalIndex].scaleOut(radius, temp2), temp2).clone(closestPoint);
            pair.depth = radius - maxDist;

        }
    }
    if (vertex) {
        Vector.subtract(closestPoint, circlePosition, pair.normal);

        const distSquared: number = pair.normal.lengthSquared();

        if (Math.pow(radius, 2) < distSquared) {
            return;
        }

        if (distSquared === 0) {
            return;
        }

        const dist: number = Math.sqrt(distSquared);

        pair.depth = radius - dist;
        pair.normal.divide(dist);
        if (flipped) {
            pair.normal.neg();
        }
    }
    
    const offset: Vector = (flipped ? pair.normal : pair.normal.negOut(temp2)).scaleOut(convex.radius, temp2);
    
    pair.contactsCount = 1;
    offset.add(closestPoint).clone(pair.contacts[0].vertex);
    
    pair.isActive = true;
}