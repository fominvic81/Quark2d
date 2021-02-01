import { Vector } from '../../../math/Vector';
import { Shape } from '../../../body/shapes/Shape';
import { Narrowphase } from './Narrowphase';

export const ConvexVsCircle = (shapePair) => {

    const flipped = shapePair.shapeA.type === Shape.CONVEX;
    const shapeA = flipped ? shapePair.shapeA : shapePair.shapeB; // convex
    const shapeB = flipped ? shapePair.shapeB : shapePair.shapeA; // circle

    const vertices = shapeA.getWorldVertices();
    const normals = shapeA.getWorldNormals();
    
    const positionB = shapeB.getWorldPosition();
    const radius = shapeA.radius + shapeB.radius;

    const closestPoint = Vector.temp[4];

    const motion = shapeA.body.motion + shapeB.body.speedSquared;

    const canUsePrevCol = shapePair.prev.isActive && motion < Narrowphase.PREV_COLLISION_MOTION_LIMIT && shapePair.prev.indexA !== -1;

    const temp1 = Vector.temp[1];
    const temp2 = Vector.temp[2];
    const temp3 = Vector.temp[3];

    if (canUsePrevCol) {
        const normalIndex = shapePair.prev.indexA;

        if (shapePair.prev.vertexCol) {
            
            Vector.clone(vertices[normalIndex], closestPoint);
            Vector.subtract(closestPoint, positionB, shapePair.normal);

            const distSquared = Vector.lengthSquared(shapePair.normal);

            if (Math.pow(radius, 2) < distSquared) {
                return shapePair;
            }

            if (distSquared === 0) {
                return shapePair;
            }

            const dist = Math.sqrt(distSquared);

            shapePair.depth = radius - dist;
            Vector.divide(shapePair.normal, dist);
            if (flipped) {
                Vector.neg(shapePair.normal);
            }
            shapePair.indexA = normalIndex;
            shapePair.vertexCol = true;
            
        } else {
            
            Vector.clone(normals[normalIndex], shapePair.normal);
            if (!flipped) {
                Vector.neg(shapePair.normal);
            }

            shapePair.indexA = normalIndex;
            shapePair.vertexCol = false;


            Vector.clone(Vector.subtract(positionB, Vector.scale(normals[normalIndex], radius, temp2), temp2), closestPoint);
            const dist = Vector.dot(normals[normalIndex], Vector.subtract(positionB, vertices[normalIndex], temp1));
            shapePair.depth = radius - dist;
        }

    } else {

        let maxDist = -Infinity;
        let normalIndex;

        for (const normal of normals) {

            const dot = Vector.dot(normal, Vector.subtract(positionB, vertices[normal.index], temp1));

            if (dot > maxDist) {
                normalIndex = normal.index;
                maxDist = dot;
            }
        }


        const point1 = vertices[normalIndex];

        if (Vector.dot(Vector.subtract(positionB, point1, temp1), normals[normalIndex]) > radius) {
            return shapePair;
        }

        const point2 = vertices[(normalIndex + 1) % vertices.length];

        const dot1 = Vector.dot(Vector.subtract(positionB, point1, temp2), Vector.subtract(point2, point1, temp3));

        if (dot1 < 0) {
            
            Vector.clone(point1, closestPoint);
            shapePair.vertexCol = true;

        } else {
            
            const dot2 = Vector.dot(Vector.subtract(positionB, point2, temp2), Vector.subtract(point1, point2, temp3));

            if (dot2 < 0) {

                Vector.clone(point2, closestPoint);
                shapePair.vertexCol = true;

            } else {

                Vector.clone(normals[normalIndex], shapePair.normal);
                if (!flipped) {
                    Vector.neg(shapePair.normal);
                }
                shapePair.indexA = normalIndex;
                shapePair.vertexCol = false;

                Vector.clone(Vector.subtract(positionB, Vector.scale(normals[normalIndex], radius, temp2), temp2), closestPoint);
                shapePair.depth = radius - maxDist;

            }
        }
        if (shapePair.vertexCol) {
            Vector.subtract(closestPoint, positionB, shapePair.normal);

            const distSquared = Vector.lengthSquared(shapePair.normal);

            if (Math.pow(radius, 2) < distSquared) {
                return shapePair;
            }

            if (distSquared === 0) {
                return shapePair;
            }

            const dist = Math.sqrt(distSquared);

            shapePair.depth = radius - dist;
            Vector.divide(shapePair.normal, dist);
            if (flipped) {
                Vector.neg(shapePair.normal);
            }
            shapePair.indexA = normalIndex;
        }
    }

    shapePair.isActive = true;
    
    const offset = Vector.scale(flipped ? shapePair.normal : Vector.neg(shapePair.normal, temp2), shapeA.radius, temp2);

    shapePair.contactsCount = 1;
    Vector.clone(Vector.add(offset, closestPoint), shapePair.contacts[0].vertex)

    return shapePair;
}