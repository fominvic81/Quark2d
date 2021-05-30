import { Convex } from '../../../body/shapes/Convex';
import { Edge } from '../../../body/shapes/Edge';
import { Shape, ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';
import { Pair } from '../../pair/Pair';
import { GJK, SupportPoint } from './Distance';

const convexSupportEdge = (convex: Convex, index: number, normal: Vector): [Vector, Vector] => {
    const vertices = convex.vertices;
    const vertex1 = vertices[index];
    let vertex2: Vector;

    const dist1 = Vector.dot(normal, vertices[index - 1 >= 0 ? index - 1 : vertices.length - 1]);
    const dist2 = Vector.dot(normal, vertices[(index + 1) % vertices.length]);

    if (dist1 > dist2) {
        vertex2 = vertices[(index + vertices.length - 1) % vertices.length];
    } else {
        vertex2 = vertices[(index + 1) % vertices.length];
    }

    return [vertex1, vertex2];
}

const edgeSupportEdge = (edge: Edge, index: number): [Vector, Vector] => {
    return index ? [edge.end, edge.start] : [edge.start, edge.end];
}

const supportEdge = (shape: Shape, index: number, normal: Vector): [Vector, Vector] => {
    switch (shape.type) {
        case ShapeType.CONVEX: return convexSupportEdge(<Convex>shape, index, normal);
        case ShapeType.EDGE: return edgeSupportEdge(<Edge>shape, index);
    }
    throw new Error();
}

export const clip = (output: Vector[], incFace: Vector[], normal: Vector, offset: number): number => {

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

const contactsTemp = [
    new Vector(),
    new Vector(),
];

export const contacts = (pair: Pair, refFace: Vector[], incFace: Vector[], normal: Vector, tangent: Vector, radius: number) => {
    const offset1 = Vector.dot(tangent, refFace[0]);
    const offset2 = -Vector.dot(tangent, refFace[1]);

    const contacts = [
        pair.contacts[0].vertex,
        pair.contacts[1].vertex,
    ];

    let count = clip(contactsTemp, incFace, tangent.neg(Vector.temp[2]), offset1);
    if (count < 2) {
        pair.contactsCount = count;
        contactsTemp[0].clone(contacts[0]);
        return;
    }

    count = clip(contacts, contactsTemp, tangent, offset2);

    pair.contactsCount = count;
    if (count < 2) {
        return;
    }

    const separation = Vector.dot(contacts[1], normal) - Vector.dot(refFace[0], normal);

    if (separation > radius) {
        --pair.contactsCount;
    }
}

const temp = new Vector();
export const collide = (pair: Pair) => {

    const shapeA = pair.shapeA;
    const shapeB = pair.shapeB;

    const points: SupportPoint[] = [];

    if (!GJK(shapeA, shapeB, true, points)) return;

    const normal = pair.normal;
    const radius = shapeA.radius + shapeB.radius;

    if (points.length === 1) {
        const vertex1 = points[0].pointA;
        const vertex2 = points[0].pointB;

        Vector.subtract(vertex2, vertex1, normal);

        const lengthSquared = normal.lengthSquared();

        if (lengthSquared > radius * radius || lengthSquared === 0) {
            return;
        }

        const length = Math.sqrt(lengthSquared);
        normal.divide(length);

        pair.depth = radius - length;

        pair.contactsCount = 1;
        Vector.add(vertex1, normal.scale(shapeA.radius, temp), pair.contacts[0].vertex);
    } else {
        let incFace: Vector[];
        let refFace: Vector[];
        let incRadius: number;
        let flipped: boolean = false;

        if (points[0].pointA === points[1].pointA) {
            shapeB.getNormal(points[1].indexB, normal);
            pair.depth = -Vector.dot(normal, points[0].point) + radius;
            incRadius = shapeA.radius;
            

            incFace = supportEdge(shapeA, points[0].indexA, normal.neg(temp));
            refFace = [points[0].pointB, points[1].pointB];
        } else {
            shapeA.getNormal(points[1].indexA, normal);
            pair.depth = Vector.dot(normal, points[0].point) + radius;
            incRadius = shapeB.radius;
            
            incFace = supportEdge(shapeB, points[0].indexB, normal.neg(temp));
            refFace = [points[0].pointA, points[1].pointA];
            
            flipped = true;
        }

        if (pair.depth < 0) return;

        const tangent = normal.rotate270(temp);
        contacts(pair, refFace, incFace, normal, tangent, radius);

        for (let i = 0; i < pair.contactsCount; ++i) {
            pair.contacts[i].vertex.subtract(normal.scale(incRadius, temp));
        }
        if (!flipped) normal.neg();

    }
    pair.isActive = true;
}