import { Shape } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';


export const EdgeVsCircle = (shapePair) => {

    const flipped = shapePair.shapeA.type === Shape.EDGE;
    const edge = flipped ? shapePair.shapeA : shapePair.shapeB;
    const circle = flipped ? shapePair.shapeB : shapePair.shapeA;

    const temp0 = Vector.temp[0];

    const normal = shapePair.normal;

    const radius = edge.radius + circle.radius;
    const edgeLength = edge.length;

    Vector.subtract(edge.start, circle.worldPosition, normal);

    const dot = Vector.dot(normal, Vector.rotate90(edge.normal, temp0));

    if (dot > edgeLength) {
        Vector.subtract(edge.end, circle.worldPosition, normal);

        const distSquared = Vector.lengthSquared(normal);

        if (distSquared > Math.pow(radius, 2)) {
            return;
        }

        const dist = Math.sqrt(distSquared);

        Vector.divide(normal, dist);
        shapePair.depth = radius - dist;

    } else if (dot < 0) {
        const distSquared = Vector.lengthSquared(normal);

        if (distSquared > Math.pow(radius, 2)) {
            return;
        }

        const dist = Math.sqrt(distSquared);

        Vector.divide(normal, dist);
        shapePair.depth = radius - dist;
    } else {

        const eDot = Vector.dot(edge.start, edge.normal);
        const cDot = Vector.dot(circle.worldPosition, edge.normal);

        const dist = eDot - cDot;

        if (dist > 0) {
            if (dist > radius) {
                return;
            }
            shapePair.depth = radius - dist;
            Vector.clone(edge.normal, normal);
        } else {
            if (dist < -radius) {
                return;
            }
            shapePair.depth = radius + dist;
            Vector.neg(edge.normal, normal);
        }

    }

    shapePair.contactsCount = 1;
    Vector.clone(
        Vector.add(Vector.scale(normal, circle.radius, temp0), circle.worldPosition),
        shapePair.contacts[0].vertex,
    );

    if (flipped) {
        Vector.neg(normal);
    }

    shapePair.isActive = true;
    return;
}