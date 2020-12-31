import { Vector } from '../../../math/Vector';
import { Vertices } from '../../../math/Vertices';

// TODO: fix vertex-vertex collision

export const ConvexVsConvex = (shapePair) => {

    const shapeA = shapePair.shapeA;
    const shapeB = shapePair.shapeB;
    let minOverlap;
    
    const overlapA = findMinOverlapNormal(shapeA, shapeB, shapeA.getWorldNormals());
    if (overlapA.overlap < 0) return shapePair;

    const overlapB = findMinOverlapNormal(shapeB, shapeA, shapeB.getWorldNormals());
    if (overlapB.overlap < 0) return shapePair;

    let reference;
    let incident;
    let swapped = false;

    if (overlapA.overlap < overlapB.overlap) {
        minOverlap = overlapA;
        reference = shapeA;
        incident = shapeB;
    } else {
        minOverlap = overlapB;
        reference = shapeB;
        incident = shapeA;
        swapped = true;
    }
    
    const verticesA = shapeA.getWorldVertices();
    const verticesB = shapeB.getWorldVertices();
    const refVertices = swapped ? verticesB : verticesA;
    const incVertices = swapped ? verticesA : verticesB;

    shapePair.depth = minOverlap.overlap;
    Vector.clone(minOverlap.normal, shapePair.normal);
    shapePair.isActive = true;

    if (Vector.dot(
        shapePair.normal,
        Vector.subtract(
            shapeA.getWorldPosition(),
            shapeB.getWorldPosition(),
            Vector.temp[0],
        )) > 0) {
        Vector.neg(shapePair.normal);
    }
    if (swapped) {
        Vector.neg(shapePair.normal);
    }


    // find contacts
    const radius = shapeA.radius + shapeB.radius;
    const offset = Vector.scale(shapePair.normal, radius, Vector.temp[0]);
    const offsetA = Vector.scale(shapePair.normal, reference.radius, Vector.temp[4]);
    const offsetB = Vector.scale(shapePair.normal, incident.radius, Vector.temp[5]);

    shapePair.contactsCount = 0;

    const refSupports = [
        refVertices[minOverlap.index],
        refVertices[(minOverlap.index + 1) % refVertices.length],
    ];

    for (const support of refSupports) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(incVertices, Vector.add(support, offset, Vector.temp[6]))) {
            Vector.clone(
                Vector.add(support, offsetA, Vector.temp[6]),
                shapePair.contacts[shapePair.contactsCount].vertex,
            );
            shapePair.contactsCount += 1;
        }
    }

    const incSupports = findSupports(incVertices, Vector.neg(shapePair.normal, Vector.temp[3]), minOverlap.indexB);
    for (const support of incSupports) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(refVertices, Vector.subtract(support, offset, Vector.temp[6]))) {
            Vector.clone(
                Vector.subtract(support, offsetB, Vector.temp[6]),
                shapePair.contacts[shapePair.contactsCount].vertex);
            shapePair.contactsCount += 1;
        }
    }

    if (shapePair.contactsCount === 0) {
        shapePair.contactsCount = 1;
        Vector.clone(Vector.subtract(incSupports[0], offsetB, Vector.temp[6]), shapePair.contacts[0].vertex);
    }

    if (swapped) {
        Vector.neg(shapePair.normal);
    }

    return shapePair;
}

const findMinOverlapNormal = (shapeA, shapeB, normals) => {

    const minOverlap = {overlap: Infinity};

    for (const normal of normals) {

        const projectionA = shapeA.projectOnOwn(normal.index);
        const projectionB = shapeB.project(normal);

        const overlapA = projectionA.max - projectionB.min;
        const overlapB = projectionB.max - projectionA.min;

        if (overlapA < overlapB) {
            if (overlapA <= 0) {
                minOverlap.overlap = overlapA;
                return minOverlap;
            }
            if (overlapA < minOverlap.overlap) {
                minOverlap.overlap = overlapA;
                minOverlap.normal = normal;
                minOverlap.index = projectionA.maxIndex;
                minOverlap.indexB = projectionB.minIndex;
            }
        } else {
            if (overlapB <= 0) {
                minOverlap.overlap = overlapB;
                return minOverlap;
            }
            if (overlapB < minOverlap.overlap) {
                minOverlap.overlap = overlapB;
                minOverlap.normal = normal;
                minOverlap.index = projectionA.minIndex;
                minOverlap.indexB = projectionB.maxIndex;
            }
        }
    }

    return minOverlap;
}

const findSupports = (vertices, normal, index) => {
    const vertex1 = Vector.temp[1];
    const vertex2 = Vector.temp[2];
    
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