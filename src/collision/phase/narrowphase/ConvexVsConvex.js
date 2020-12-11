import { Vector } from '../../../math/Vector';
import { Vertices } from '../../../math/Vertices';

export const ConvexVsConvex = (shapePair) => {

    const shapeA = shapePair.shapeA;
    const shapeB = shapePair.shapeB;
    let minOverlap;
    
    const overlapA = findMinOverlapNormal(shapeA, shapeB, shapeA.getWorldNormals());
    if (overlapA.overlap <= 0) return shapePair;

    const overlapB = findMinOverlapNormal(shapeA, shapeB, shapeB.getWorldNormals());
    if (overlapB.overlap <= 0) return shapePair;

    if (overlapA.overlap < overlapB.overlap) {
        minOverlap = overlapA;
    } else {
        minOverlap = overlapB;
    }

    shapePair.isActive = true;
    shapePair.depth = minOverlap.overlap;

    Vector.clone(minOverlap.normal, shapePair.normal);

    if (Vector.dot(shapePair.normal, Vector.subtract(shapeA.getWorldPosition(), shapeB.getWorldPosition(), Vector.temp[0])) > 0) {
        Vector.neg(shapePair.normal);
    }

    // find contacts
    shapePair.contactsCount = 0;
    const verticesA = shapeA.getWorldVertices();
    const verticesB = shapeB.getWorldVertices();

    const supportsA = findSupports(verticesA, shapePair.normal);
    for (const support of supportsA) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(verticesB, support)) {
            Vector.clone(support, shapePair.contacts[shapePair.contactsCount].vertex);
            shapePair.contactsCount += 1;
        }
    }
    
    const supportsB = findSupports(verticesB, Vector.neg(shapePair.normal, Vector.temp[3]));
    for (const support of supportsB) {
        if (shapePair.contactsCount > 1) break;
        if (Vertices.contains(verticesA, support)) {
            Vector.clone(support, shapePair.contacts[shapePair.contactsCount].vertex);
            shapePair.contactsCount += 1;
        }
    }

    if (shapePair.contactsCount === 0) {
        shapePair.contactsCount = 1;
        Vector.clone(supportsA[0], shapePair.contacts[0].vertex);
    }

    return shapePair;
}

const findMinOverlapNormal = (shapeA, shapeB, normals) => {

    const minOverlap = {overlap: Infinity};

    for (const normal of normals) {

        const projectionA = shapeA.project(normal);
        const projectionB = shapeB.project(normal);

        const overlap = Math.min(projectionA.max - projectionB.min, projectionB.max - projectionA.min);

        if (overlap <= 0) {
            minOverlap.overlap = overlap;
            return minOverlap;
        }
        if (overlap < minOverlap.overlap) {
            minOverlap.overlap = overlap;
            minOverlap.normal = normal;
        }
    }

    return minOverlap;
}

const findSupports = (vertices, normal) => {
    let minDist = Infinity;
    const vertex1 = Vector.temp[1];
    const vertex2 = Vector.temp[2];
    
    
    for (const vertex of vertices) {
        const dist = -Vector.dot(normal, vertex);
        if (dist < minDist) {
            Vector.clone(vertex, vertex1);
            vertex1.index = vertex.index;
            minDist = -Vector.dot(normal, vertex);
        }
    }

    const dist1 = -Vector.dot(
        normal,
        vertices[vertex1.index - 1 >= 0 ? vertex1.index - 1 : vertices.length - 1],
    );
    const dist2 = -Vector.dot(
        normal,
        vertices[(vertex1.index + 1) % vertices.length],
    );

    if (dist1 < dist2) {
        Vector.clone(vertices[vertex1.index - 1 >= 0 ? vertex1.index - 1 : vertices.length - 1], vertex2);
    } else {
        Vector.clone(vertices[(vertex1.index + 1) % vertices.length], vertex2);
    }

    return [vertex1, vertex2];
}