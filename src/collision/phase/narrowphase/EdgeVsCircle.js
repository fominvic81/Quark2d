import { ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';


export const EdgeVsCircle = (shapePair) => {

    const flipped = shapePair.shapeA.type === ShapeType.EDGE;
    const edge = flipped ? shapePair.shapeA : shapePair.shapeB;
    const circle = flipped ? shapePair.shapeB : shapePair.shapeA;

    const temp0 = Vector.temp[0];

    const normal = shapePair.normal;

    const radius = edge.radius + circle.radius;
    const edgeLength = edge.length;

    Vector.subtract(edge.start, circle.position, normal);

    const dot = Vector.cross(edge.normal, normal);

    if (dot > edgeLength) {
        Vector.subtract(edge.end, circle.position, normal);

        const distSquared = normal.lengthSquared();

        if (distSquared > Math.pow(radius, 2)) {
            return;
        }

        const dist = Math.sqrt(distSquared);

        normal.divide(dist);
        shapePair.depth = radius - dist;

    } else if (dot < 0) {
        const distSquared = normal.lengthSquared();

        if (distSquared > Math.pow(radius, 2)) {
            return;
        }

        const dist = Math.sqrt(distSquared);

        normal.divide(dist);
        shapePair.depth = radius - dist;
    } else {

        const eDot = Vector.dot(edge.start, edge.normal);
        const cDot = Vector.dot(circle.position, edge.normal);

        const dist = eDot - cDot;

        if (dist > 0) {
            if (dist > radius) {
                return;
            }
            shapePair.depth = radius - dist;
            edge.normal.clone(normal);
        } else {
            if (dist < -radius) {
                return;
            }
            shapePair.depth = radius + dist;
            edge.normal.neg(normal);
        }

    }

    shapePair.contactsCount = 1;
    Vector.add(normal.scale(circle.radius, temp0), circle.position).clone(shapePair.contacts[0].vertex);

    if (flipped) {
        normal.neg();
    }

    shapePair.isActive = true;
    return;
}