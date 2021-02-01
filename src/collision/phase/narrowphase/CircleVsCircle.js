import { Vector } from '../../../math/Vector';

export const CircleVsCircle = (shapePair) => {

    const shapeA = shapePair.shapeA;
    const shapeB = shapePair.shapeB;
    const positionA = shapeA.getWorldPosition();
    const positionB = shapeB.getWorldPosition();

    const n = Vector.subtract(positionA, positionB, Vector.temp[0]);

    const radius = shapeA.radius + shapeB.radius;

    const distSquared = Vector.lengthSquared(n);

    if (distSquared > Math.pow(radius, 2)) {
        return shapePair;
    }
    shapePair.isActive = true;
    shapePair.contactsCount = 1;

    if (distSquared < 0.0000001) {
        Vector.set(shapePair.normal, 0, 1);
        shapePair.depth = shapeA.radius + shapeB.radius;
        Vector.clone(positionA, shapePair.contacts[0].vertex);
        
        return shapePair;
    }

    const dist = Vector.length(n);

    shapePair.depth = radius - dist;
    Vector.divide(n, -dist, shapePair.normal);

    Vector.clone(
        Vector.add(
            positionA,
            Vector.scale(
                shapePair.normal,
                shapeA.radius + (dist - (shapeA.radius + shapeB.radius)) / 2,
                Vector.temp[0],
            ),
            Vector.temp[0],
        ),
        shapePair.contacts[0].vertex,
    );

    return shapePair;
}