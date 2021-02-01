import { Vector } from '../../../math/Vector';
import { Vertices } from '../../../math/Vertices';
import { Narrowphase } from './Narrowphase';

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
        // if (shapePair.prev.vertexCol) {
        //     // TODO
        // } else {
        if (shapePair.prev.flipped) {
            reference = shapeB;
            incident = shapeA;
            flipped = true;
        } else {
            reference = shapeA;
            incident = shapeB;
        }

        const normal = reference.getWorldNormals()[shapePair.prev.indexA];

        minOverlap = findMinOverlapNormal(reference, incident, [normal]);
        if (minOverlap.overlap < 0) return shapePair;
        // }

    } else {
        const overlapA = findMinOverlapNormal(shapeA, shapeB, shapeA.getWorldNormals());
        if (overlapA.overlap < 0) return shapePair;

        const overlapB = findMinOverlapNormal(shapeB, shapeA, shapeB.getWorldNormals());
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

    const temp0 = Vector.temp[0];
    const temp1 = Vector.temp[1];

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
        if (Vertices.contains(incVertices, Vector.add(support, offset, temp1))) {
            Vector.clone(
                Vector.add(support, offsetA, temp1),
                shapePair.contacts[shapePair.contactsCount].vertex,
            );
            shapePair.contactsCount += 1;
        }
    }

    const incSupports = findSupports(incVertices, Vector.neg(shapePair.normal, Vector.temp[4]), minOverlap.indexB);
    for (const support of incSupports) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(refVertices, Vector.subtract(support, offset, temp1))) {
            Vector.clone(
                Vector.subtract(support, offsetB, temp1),
                shapePair.contacts[shapePair.contactsCount].vertex);
            shapePair.contactsCount += 1;
        }
    }

    if (shapePair.contactsCount === 0) {
        // if 2 sides are parallel it works uncorrect
        const distSquared1 = Vector.distSquared(incSupports[0], refSupports[0]);
        const distSquared2 = Vector.distSquared(incSupports[0], refSupports[1]);

        if (distSquared1 < distSquared2) {
            Vector.subtract(incSupports[0], refSupports[0], temp0);
            
            const dist = Math.sqrt(distSquared1);
            Vector.divide(temp0, dist);
        } else {
            Vector.subtract(incSupports[0], refSupports[1], temp0);

            const dist = Math.sqrt(distSquared2);
            Vector.divide(temp0, dist);
        }

        const dot = Vector.dot(incSupports[0], temp0);
        const projection = reference.project(temp0);

        const depth = projection.value - dot + radius;

        if (depth < 0) {
            return shapePair;
        }
        if (depth < shapePair.depth) {
            shapePair.depth = depth;
            Vector.clone(temp0, shapePair.normal);
            Vector.scale(temp0, incident.radius, offsetB);

            shapePair.vertexCol = true;
        }


        shapePair.contactsCount = 1;
        Vector.clone(Vector.subtract(incSupports[0], offsetB, temp1), shapePair.contacts[0].vertex);
    }

    shapePair.isActive = true;

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