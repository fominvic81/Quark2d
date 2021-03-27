import { Vector } from '../../../math/Vector';
import { Shape } from '../../../body/shapes/Shape';

export const ConvexVsCircle = (shapePair) => {

    const flipped = shapePair.shapeA.type === Shape.CONVEX;
    const convex = flipped ? shapePair.shapeA : shapePair.shapeB;
    const circle = flipped ? shapePair.shapeB : shapePair.shapeA;

    const vertices = convex.vertices;
    const normals = convex.normals;
    const circlePosition = circle.position;

    const radius = convex.radius + circle.radius;

    const closestPoint = Vector.temp[4];

    const temp1 = Vector.temp[1];
    const temp2 = Vector.temp[2];
    const temp3 = Vector.temp[3];

    let maxDist = -Infinity;
    let normalIndex;
    let vertex = false;

    for (const normal of normals) {

        const dot = Vector.dot(normal, Vector.subtract(circlePosition, vertices[normal.index], temp1));

        if (dot > maxDist) {
            normalIndex = normal.index;
            maxDist = dot;
        }
    }


    const point1 = vertices[normalIndex];

    if (Vector.dot(Vector.subtract(circlePosition, point1, temp1), normals[normalIndex]) > radius) {
        return;
    }

    const point2 = vertices[(normalIndex + 1) % vertices.length];

    const dot1 = Vector.dot(Vector.subtract(circlePosition, point1, temp2), Vector.subtract(point2, point1, temp3));

    if (dot1 < 0) {

        point1.clone(closestPoint);
        vertex = true;

    } else {

        const dot2 = Vector.dot(Vector.subtract(circlePosition, point2, temp2), Vector.subtract(point1, point2, temp3));

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

        const distSquared = shapePair.normal.lengthSquared();

        if (Math.pow(radius, 2) < distSquared) {
            return;
        }

        if (distSquared === 0) {
            return;
        }

        const dist = Math.sqrt(distSquared);

        shapePair.depth = radius - dist;
        shapePair.normal.divide(dist);
        if (flipped) {
            shapePair.normal.neg();
        }
    }
    
    const offset = (flipped ? shapePair.normal : shapePair.normal.neg(temp2)).scale(convex.radius, temp2);
    
    shapePair.contactsCount = 1;
    Vector.add(offset, closestPoint).clone(shapePair.contacts[0].vertex);
    
    shapePair.isActive = true;
    return;
}