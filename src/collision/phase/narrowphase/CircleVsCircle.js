import { Vector } from '../../../math/Vector';

export const CircleVsCircle = (shapePair) => {

    const circleA = shapePair.shapeA;
    const circleB = shapePair.shapeB;

    const normal = shapePair.normal;

    Vector.subtract(circleB.position, circleA.position, normal);

    const radius = circleA.radius + circleB.radius;

    const distSquared = normal.lengthSquared();

    if (distSquared > Math.pow(radius, 2)) return;

    shapePair.contactsCount = 1;

    const dist = normal.length();

    shapePair.depth = radius - dist;
    normal.divide(dist)

    Vector.add(shapePair.normal.scale(circleA.radius, Vector.temp[0]), circleA.position).clone(shapePair.contacts[0].vertex);

    shapePair.isActive = true;
    return;
}