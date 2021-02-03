import { Shape } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';


export const EdgeVsCircle = (shapePair) => {

    const flipped = shapePair.shapeA.type === Shape.EDGE;
    const shapeA = flipped ? shapePair.shapeA : shapePair.shapeB; // edge
    const shapeB = flipped ? shapePair.shapeB : shapePair.shapeA; // circle

    const temp0 = Vector.temp[0];

    const normal = shapePair.normal;

    const radius = shapeA.radius + shapeB.radius;
    const edgeLength = shapeA.length;

    Vector.subtract(shapeA.start, shapeB.worldPosition, normal);

    const dot = Vector.dot(normal, Vector.rotate90(shapeA.normal, temp0));

    if (dot > edgeLength) {
        Vector.subtract(shapeA.end, shapeB.worldPosition, normal);

        const distSquared = Vector.lengthSquared(normal);

        if (distSquared > Math.pow(radius, 2)) {
            return shapePair;
        }

        const dist = Math.sqrt(distSquared);

        Vector.divide(normal, dist);
        shapePair.depth = radius - dist;

    } else if (dot < 0) {
        const distSquared = Vector.lengthSquared(normal);

        if (distSquared > Math.pow(radius, 2)) {
            return shapePair;
        }

        const dist = Math.sqrt(distSquared);

        Vector.divide(normal, dist);
        shapePair.depth = radius - dist;
    } else {

        const eDot = Vector.dot(shapeA.start, shapeA.normal);
        const cDot = Vector.dot(shapeB.worldPosition, shapeA.normal);

        const dist = eDot - cDot;

        if (dist > 0) {
            if (dist > radius) {
                return shapePair;
            }
            shapePair.depth = radius - dist;
            Vector.clone(shapeA.normal, normal);
        } else {
            if (dist < -radius) {
                return shapePair;
            }
            shapePair.depth = radius + dist;
            Vector.neg(shapeA.normal, normal);
        }

    }

    shapePair.contactsCount = 1;
    Vector.clone(
        Vector.add(shapeB.worldPosition, Vector.scale(normal, shapeB.radius, temp0), temp0),
        shapePair.contacts[0].vertex,
    );

    if (flipped) {
        Vector.neg(normal);
    }

    shapePair.isActive = true;


    return shapePair;
}