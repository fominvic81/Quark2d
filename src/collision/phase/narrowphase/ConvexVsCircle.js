import { Vector } from '../../../math/Vector';
import { Shape } from '../../../body/shapes/Shape';

export const ConvexVsCircle = (shapePair) => {

    const a = shapePair.shapeA.type === Shape.CONVEX;
    const shapeA = a ? shapePair.shapeA : shapePair.shapeB; // convex
    const shapeB = a ? shapePair.shapeB : shapePair.shapeA; // circle
    const positionB = shapeB.getWorldPosition();

    const fromAtoB = Vector.subtract(shapePair.shapeB.getWorldPosition(), shapePair.shapeA.getWorldPosition(), Vector.temp[0]);

    const normals = shapeA.getWorldNormals(false);
    const vertices = shapeA.getWorldVertices();

    let maxDist = -Infinity;
    let vertexIndex;

    for (const normal of normals) {

        const dot = Vector.dot(normal, Vector.subtract(positionB, vertices[normal.index], Vector.temp[1]));

        if (dot > maxDist) {
            vertexIndex = normal.index;
            maxDist = dot;
        }
    }

    const radius = shapeA.radius + shapeB.radius;

    const point1 = vertices[vertexIndex];

    if (Vector.dot(Vector.subtract(positionB, point1, Vector.temp[1]), normals[vertexIndex]) > radius) {
        return shapePair;
    }

    const point2 = vertices[(vertexIndex + 1) % vertices.length];
    const closestPoint = Vector.temp[1];

    const dot1 = Vector.dot(Vector.subtract(positionB, point1, Vector.temp[2]), Vector.subtract(point2, point1, Vector.temp[3]));

    if (dot1 <= 0) {
        
        Vector.clone(point1, closestPoint);
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
        shapePair.isActive = true;

    } else {
        
        const dot2 = Vector.dot(Vector.subtract(positionB, point2, Vector.temp[2]), Vector.subtract(point1, point2, Vector.temp[3]));

        if (dot2 <= 0) {

            Vector.clone(point2, closestPoint);
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
            shapePair.isActive = true;

        } else {

            Vector.clone(normals[vertexIndex], shapePair.normal);

            if (Vector.dot(Vector.subtract(positionB, point1, Vector.temp[1]), normals[vertexIndex]) > 0) {
                Vector.neg(shapePair.normal);
            }

            Vector.clone(Vector.subtract(positionB, Vector.scale(normals[vertexIndex], radius, Vector.temp[2]), Vector.temp[2]), closestPoint);
            shapePair.depth = radius - maxDist;
            shapePair.isActive = true;

        }
    }

    if (Vector.dot(shapePair.normal, fromAtoB) < 0) {
        Vector.neg(shapePair.normal);
    }

    const offset = Vector.scale(a ? shapePair.normal : Vector.neg(shapePair.normal, Vector.temp[2]), shapeA.radius, Vector.temp[2]);

    shapePair.contactsCount = 1;
    Vector.clone(Vector.add(offset, closestPoint), shapePair.contacts[0].vertex)

    return shapePair;
}