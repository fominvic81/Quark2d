import { Vector } from '../../../math/Vector';
import { Vertices } from '../../../math/Vertices';
import { Narrowphase } from './Narrowphase';

// TODO: fix vertex-vertex collision

export const ConvexVsConvex = (shapePair) => {

    const shapeA = shapePair.shapeA;
    const shapeB = shapePair.shapeB;
    let minOverlap;
    let reference;
    let incident;
    let flipped = false;

    const motion = shapeA.body.motion + shapeB.body.motion;

    const canUsePrevCol = shapePair.prev.isActive && motion < Narrowphase.PREV_COLLISION_MOTION_LIMIT && shapePair.prev.indexA !== -1;

    if (canUsePrevCol) {
        if (shapePair.prev.vertexCol) {
            // TODO
        } else {
            if (shapePair.prev.flipped) {
                reference = shapeB;
                incident = shapeA;
                flipped = true;
            } else {
                reference = shapeA;
                incident = shapeB;
            }

            const normal = reference.getWorldNormals(false)[shapePair.prev.indexA];

            minOverlap = findMinOverlapNormal(reference, incident, [normal]);
            if (minOverlap.overlap < 0) return shapePair;
        }

    } else {
        const overlapA = findMinOverlapNormal(shapeA, shapeB, shapeA.getWorldNormals(false));
        if (overlapA.overlap < 0) return shapePair;

        const overlapB = findMinOverlapNormal(shapeB, shapeA, shapeB.getWorldNormals(false));
        if (overlapB.overlap < 0) return shapePair;

        if (overlapA.overlap < overlapB.overlap) {
            minOverlap = overlapA;
            reference = shapeA;
            incident = shapeB;
        } else {
            minOverlap = overlapB;
            reference = shapeB;
            incident = shapeA;
            flipped = true;
        }
    }

    const verticesA = shapeA.getWorldVertices();
    const verticesB = shapeB.getWorldVertices();
    const refVertices = flipped ? verticesB : verticesA;
    const incVertices = flipped ? verticesA : verticesB;

    shapePair.depth = minOverlap.overlap;
    Vector.clone(minOverlap.normal, shapePair.normal);
    shapePair.indexA = minOverlap.index;
    shapePair.flipped = flipped;
    shapePair.isActive = true;

    const temp0 = Vector.temp[0];
    const temp4 = Vector.temp[4];

    const radius = shapeA.radius + shapeB.radius;
    const offset = Vector.scale(shapePair.normal, radius, temp0);
    const offsetA = Vector.scale(shapePair.normal, reference.radius, Vector.temp[2]);
    const offsetB = Vector.scale(shapePair.normal, incident.radius, Vector.temp[3]);

    shapePair.contactsCount = 0;

    const refSupports = [
        refVertices[minOverlap.index],
        refVertices[(minOverlap.index + 1) % refVertices.length],
    ];

    for (const support of refSupports) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(incVertices, Vector.add(support, offset, temp4))) {
            Vector.clone(
                Vector.add(support, offsetA, temp4),
                shapePair.contacts[shapePair.contactsCount].vertex,
            );
            shapePair.contactsCount += 1;
        }
    }

    const incSupports = findSupports(incVertices, Vector.neg(shapePair.normal, Vector.temp[1]), minOverlap.indexB);
    for (const support of incSupports) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(refVertices, Vector.subtract(support, offset, temp4))) {
            Vector.clone(
                Vector.subtract(support, offsetB, temp4),
                shapePair.contacts[shapePair.contactsCount].vertex);
            shapePair.contactsCount += 1;
        }
    }

    if (shapePair.contactsCount === 0) {
        shapePair.contactsCount = 1;
        Vector.clone(Vector.subtract(incSupports[0], offsetB, temp4), shapePair.contacts[0].vertex);
    }

    // if (Vector.dot(
    //     shapePair.normal,
    //     Vector.subtract(
    //         shapeA.getWorldPosition(),
    //         shapeB.getWorldPosition(),
    //         temp0,
    //     )) > 0) {
    //     Vector.neg(shapePair.normal);
    // }
    if (flipped) {
        Vector.neg(shapePair.normal);
    }

    return shapePair;
}

const findMinOverlapNormal = (shapeA, shapeB, normals) => {

    const minOverlap = {overlap: Infinity};
    const radius = shapeA.radius + shapeB.radius;
    const temp0 = Vector.temp[0];

    for (const normal of normals) {

        const projectionA = shapeA.projectOnOwn(normal.index);
        const projectionB = shapeB.project(Vector.neg(normal, temp0));

        const overlap = projectionA.value + projectionB.value + radius;

        if (overlap < 0) {
            minOverlap.overlap = overlap;
            return minOverlap;
        }
        if (overlap < minOverlap.overlap) {
            minOverlap.overlap = overlap;
            minOverlap.normal = normal;
            minOverlap.index = projectionA.index;
            minOverlap.indexB = projectionB.index;
        }
    }

    return minOverlap;
}

const findSupports = (vertices, normal, index) => {
    const vertex1 = Vector.temp[5];
    const vertex2 = Vector.temp[6];
    
    Vector.clone(vertices[index], vertex1);

    const dist1 = Vector.dot(normal, vertices[index - 1 >= 0 ? index - 1 : vertices.length - 1]);
    const dist2 = Vector.dot(normal, vertices[(index + 1) % vertices.length]);

    if (dist1 > dist2) {
        Vector.clone(vertices[(index + vertices.length - 1) % vertices.length], vertex2);
    } else {
        Vector.clone(vertices[(index + 1) % vertices.length], vertex2);
    }

    return [vertex1, vertex2];
}