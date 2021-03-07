import { Vector } from '../../../math/Vector';

export const CircleVsCircle = (shapePair) => {

    const circleA = shapePair.shapeA;
    const circleB = shapePair.shapeB;

    const normal = shapePair.normal;

    Vector.subtract(circleB.position, circleA.position, normal);

    const radius = circleA.radius + circleB.radius;

    const distSquared = Vector.lengthSquared(normal);

    if (distSquared > Math.pow(radius, 2)) return;

    shapePair.contactsCount = 1;

    const dist = Vector.length(normal);

    shapePair.depth = radius - dist;
    Vector.divide(normal, dist)

    Vector.clone(
        Vector.add(Vector.scale(shapePair.normal, circleA.radius, Vector.temp[0]), circleA.position),
        shapePair.contacts[0].vertex,
    );

    shapePair.isActive = true;
    return;
}