import { Shape } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';
import { GJK } from './Distance';

const convexSupportEdge = (convex, index, normal) => {
    const vertices = convex.worldVertices;
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

const edgeSupportEdge = (edge, index) => {
    return index ? [edge.end, edge.start] : [edge.start, edge.end];
}

const supportEdge = (shape, index, normal) => {
    switch (shape.type) {
        case Shape.CONVEX: return convexSupportEdge(shape, index, normal);
        case Shape.EDGE: return edgeSupportEdge(shape, index);
    }
}

const findRefFace = (shape, points, flipped) => {
    switch (shape.type) {
        case Shape.CONVEX: return [shape.worldVertices[flipped ? points[0].indexA : points[0].indexB], shape.worldVertices[flipped ? points[1].indexA : points[1].indexB]];
        case Shape.EDGE: return [shape.getPoint(flipped ? points[0].indexA : points[0].indexB), shape.getPoint(flipped ? points[1].indexA : points[1].indexB)];
    }
}

export const clip = (output, incFace, normal, offset) => {

    const dist1 = Vector.dot(incFace[0], normal) + offset;
    const dist2 = Vector.dot(incFace[1], normal) + offset;

    let count = 0;

    if (dist1 <= 0) Vector.clone(incFace[0], output[count++]);
    if (dist2 <= 0) Vector.clone(incFace[1], output[count++]);

    if (dist1 * dist2 < 0) {
        const t = dist1 / (dist1 - dist2);
        Vector.interpolate(incFace[0], incFace[1], t, output[count++]);
    }

    return count;
}

export const contacts = (shapePair, refFace, incFace, normal, tangent, radius) => {
    const offset1 = Vector.dot(tangent, refFace[0]);
    const offset2 = -Vector.dot(tangent, refFace[1]);

    const contacts2 = [
        Vector.temp[4],
        Vector.temp[3],
    ];

    const contacts1 = [
        shapePair.contacts[0].vertex,
        shapePair.contacts[1].vertex,
    ];

    let count = clip(contacts2, incFace, Vector.neg(tangent, Vector.temp[2]), offset1);
    if (count < 2) {
        shapePair.contactsCount = count;
        Vector.clone(contacts2[0], contacts1[0]);
        return;
    }

    count = clip(contacts1, contacts2, tangent, offset2);

    shapePair.contactsCount = count;
    if (count < 2) {
        return;
    }

    const separation = Vector.dot(contacts1[1], normal) - Vector.dot(refFace[0], normal);

    if (separation > radius) {
        --shapePair.contactsCount;
    }
}

export const collide = (shapePair) => {

    const shapeA = shapePair.shapeA;
    const shapeB = shapePair.shapeB;

    const points = GJK(shapeA, shapeB);

    if (!points) return;

    const normal = shapePair.normal;
    const radius = shapeA.radius + shapeB.radius;

    if (points.length === 1) {
        const vertex1 = shapeA.getPoint(points[0].indexA);
        const vertex2 = shapeB.getPoint(points[0].indexB);

        Vector.subtract(vertex2, vertex1, normal);

        const lengthSquared = Vector.lengthSquared(normal);

        if (lengthSquared > radius * radius) {
            return;
        }

        const length = Math.sqrt(lengthSquared);
        Vector.divide(normal, length);

        shapePair.depth = radius - length;

        shapePair.contactsCount = 1;
        Vector.add(vertex1, Vector.scale(normal, shapeA.radius, Vector.temp[0]), shapePair.contacts[0].vertex);
    } else {
        let incFace;
        let refFace;
        let incRadius;
        let flipped = false;

        if (points[0].indexA === points[1].indexA) {
            shapeB.getNormal(points[1].indexB, normal);
            shapePair.depth = -Vector.dot(normal, points[0].point) + radius;
            incRadius = shapeA.radius;
            

            incFace = supportEdge(shapeA, points[0].indexA, Vector.neg(normal, Vector.temp[0]));
            refFace = findRefFace(shapeB, points, false);
        } else {
            shapeA.getNormal(points[1].indexA, normal);
            shapePair.depth = Vector.dot(normal, points[0].point) + radius;
            incRadius = shapeB.radius;
            
            incFace = supportEdge(shapeB, points[0].indexB, Vector.neg(normal, Vector.temp[0]));
            refFace = findRefFace(shapeA, points, true);
            flipped = true;
        }

        if (shapePair.depth < 0) return false;

        const tangent = Vector.rotate270(normal, Vector.temp[0]);
        contacts(shapePair, refFace, incFace, normal, tangent, radius);

        for (let i = 0; i < shapePair.contactsCount; ++i) {
            Vector.subtract(shapePair.contacts[i].vertex, Vector.scale(normal, incRadius, Vector.temp[0]));
        }
        if (!flipped) Vector.neg(normal);

    }
    shapePair.isActive = true;
    return true;
}