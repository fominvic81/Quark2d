import { Convex } from '../../../body/shapes/Convex';
import { Edge } from '../../../body/shapes/Edge';
import { Shape, ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';
import { Pair } from '../../pair/Pair';
import { GJK, SupportPoint } from './Distance';

const convexSupportEdge = (convex: Convex, index: number, normal: Vector): Array<Vector> => {
    const vertices = convex.vertices;
    const vertex1 = Vector.temp[5];
    const vertex2 = Vector.temp[6];

    vertices[index].clone(vertex1);

    const dist1 = Vector.dot(normal, vertices[index - 1 >= 0 ? index - 1 : vertices.length - 1]);
    const dist2 = Vector.dot(normal, vertices[(index + 1) % vertices.length]);

    if (dist1 > dist2) {
        vertices[(index + vertices.length - 1) % vertices.length].clone(vertex2);
    } else {
        vertices[(index + 1) % vertices.length].clone(vertex2);
    }

    return [vertex1, vertex2];
}

const edgeSupportEdge = (edge: Edge, index: number): Array<Vector> => {
    return index ? [edge.end, edge.start] : [edge.start, edge.end];
}

const supportEdge = (shape: Shape, index: number, normal: Vector): Array<Vector> => {
    switch (shape.type) {
        case ShapeType.CONVEX: return convexSupportEdge(<Convex>shape, index, normal);
        case ShapeType.EDGE: return edgeSupportEdge(<Edge>shape, index);
    }
    return [];
}

export const clip = (output: Array<Vector>, incFace: Array<Vector>, normal: Vector, offset: number): number => {

    const dist1 = Vector.dot(incFace[0], normal) + offset;
    const dist2 = Vector.dot(incFace[1], normal) + offset;

    let count = 0;

    if (dist1 <= 0) incFace[0].clone(output[count++]);
    if (dist2 <= 0) incFace[1].clone(output[count++]);

    if (dist1 * dist2 < 0) {
        const t = dist1 / (dist1 - dist2);
        Vector.interpolate(incFace[0], incFace[1], t, output[count++]);
    }

    return count;
}

export const contacts = (pair: Pair, refFace: Array<Vector>, incFace: Array<Vector>, normal: Vector, tangent: Vector, radius: number) => {
    const offset1 = Vector.dot(tangent, refFace[0]);
    const offset2 = -Vector.dot(tangent, refFace[1]);

    const contacts2 = [
        Vector.temp[4],
        Vector.temp[3],
    ];

    const contacts1 = [
        pair.contacts[0].vertex,
        pair.contacts[1].vertex,
    ];

    let count = clip(contacts2, incFace, tangent.neg(Vector.temp[2]), offset1);
    if (count < 2) {
        pair.contactsCount = count;
        contacts2[0].clone(contacts1[0]);
        return;
    }

    count = clip(contacts1, contacts2, tangent, offset2);

    pair.contactsCount = count;
    if (count < 2) {
        return;
    }

    const separation = Vector.dot(contacts1[1], normal) - Vector.dot(refFace[0], normal);

    if (separation > radius) {
        --pair.contactsCount;
    }
}

export const collide = (pair: Pair): boolean => {

    const shapeA = pair.shapeA;
    const shapeB = pair.shapeB;

    const points = GJK(shapeA, shapeB);

    if (!points.length) return false;

    const normal = pair.normal;
    const radius = shapeA.radius + shapeB.radius;

    if (points.length === 1) {
        const vertex1 = shapeA.getPoint(points[0].indexA);
        const vertex2 = shapeB.getPoint(points[0].indexB);

        Vector.subtract(vertex2, vertex1, normal);

        const lengthSquared = normal.lengthSquared();

        if (lengthSquared > radius * radius || lengthSquared === 0) {
            return false;
        }

        const length = Math.sqrt(lengthSquared);
        normal.divide(length);

        pair.depth = radius - length;

        pair.contactsCount = 1;
        Vector.add(vertex1, normal.scale(shapeA.radius, Vector.temp[0]), pair.contacts[0].vertex);
    } else {
        let incFace: Array<Vector>;
        let refFace: Array<Vector>;
        let incRadius: number;
        let flipped: boolean = false;

        if (points[0].indexA === points[1].indexA) {
            shapeB.getNormal(points[1].indexB, normal);
            pair.depth = -Vector.dot(normal, points[0].point) + radius;
            incRadius = shapeA.radius;
            

            incFace = supportEdge(shapeA, points[0].indexA, normal.neg(Vector.temp[0]));
            refFace = [shapeB.getPoint(points[0].indexB), shapeB.getPoint(points[1].indexB)];
        } else {
            shapeA.getNormal(points[1].indexA, normal);
            pair.depth = Vector.dot(normal, points[0].point) + radius;
            incRadius = shapeB.radius;
            
            incFace = supportEdge(shapeB, points[0].indexB, normal.neg(Vector.temp[0]));
            refFace = [shapeA.getPoint(points[0].indexA), shapeA.getPoint(points[1].indexA)];
            
            flipped = true;
        }

        if (pair.depth < 0) return false;

        const tangent = normal.rotate270(Vector.temp[0]);
        contacts(pair, refFace, incFace, normal, tangent, radius);

        for (let i = 0; i < pair.contactsCount; ++i) {
            pair.contacts[i].vertex.subtract(normal.scale(incRadius, Vector.temp[0]));
        }
        if (!flipped) normal.neg();

    }
    pair.isActive = true;
    return true;
}