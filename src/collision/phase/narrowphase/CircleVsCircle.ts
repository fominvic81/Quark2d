import { Circle } from '../../../body/shapes/Circle';
import { Vector } from '../../../math/Vector';
import { ShapePair } from '../../pair/ShapePair';

export const CircleVsCircle = (shapePair: ShapePair) => {

    const circleA: Circle = <Circle>shapePair.shapeA;
    const circleB: Circle = <Circle>shapePair.shapeB;

    const normal: Vector = shapePair.normal;

    Vector.subtract(circleB.position, circleA.position, normal);

    const radius: number = circleA.radius + circleB.radius;

    const distSquared: number = normal.lengthSquared();

    if (distSquared > Math.pow(radius, 2)) return;

    shapePair.contactsCount = 1;

    const dist: number = normal.length();

    shapePair.depth = radius - dist;
    normal.divide(dist)

    shapePair.normal.scale(circleA.radius, Vector.temp[0]).add(circleA.position).clone(shapePair.contacts[0].vertex);

    shapePair.isActive = true;
}