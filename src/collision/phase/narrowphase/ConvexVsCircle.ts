import { Vector } from '../../../math/Vector';
import { ShapeType } from '../../../body/shapes/Shape';
import { ShapePair } from '../../pair/ShapePair';
import { Convex } from '../../../body/shapes/Convex';
import { Circle } from '../../../body/shapes/Circle';
import { Vertex } from '../../../math/Vertex';

export const ConvexVsCircle = (shapePair: ShapePair) => {

    const flipped: boolean = shapePair.shapeA.type === ShapeType.CONVEX;
    const convex: Convex = <Convex>(flipped ? shapePair.shapeA : shapePair.shapeB);
    const circle: Circle = <Circle>(flipped ? shapePair.shapeB : shapePair.shapeA);

    const vertices: Array<Vertex> = convex.vertices;
    const normals: Array<Vertex> = convex.normals;
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

            normals[normalIndex].clone(shapePair.normal);
            if (!flipped) {
                shapePair.normal.neg();
            }

            Vector.subtract(circlePosition, normals[normalIndex].scale(radius, temp2), temp2).clone(closestPoint);
            shapePair.depth = radius - maxDist;

        }
    }
    if (vertex) {
        Vector.subtract(closestPoint, circlePosition, shapePair.normal);

        const distSquared: number = shapePair.normal.lengthSquared();

        if (Math.pow(radius, 2) < distSquared) {
            return;
        }

        if (distSquared === 0) {
            return;
        }

        const dist: number = Math.sqrt(distSquared);

        shapePair.depth = radius - dist;
        shapePair.normal.divide(dist);
        if (flipped) {
            shapePair.normal.neg();
        }
    }
    
    const offset: Vector = (flipped ? shapePair.normal : shapePair.normal.neg(temp2)).scale(convex.radius, temp2);
    
    shapePair.contactsCount = 1;
    Vector.add(offset, closestPoint).clone(shapePair.contacts[0].vertex);
    
    shapePair.isActive = true;
    return;
}