import { Circle } from '../../../body/shapes/Circle';
import { Vector } from '../../../math/Vector';
import { Pair } from '../../pair/Pair';

export const CircleVsCircle = (pair: Pair) => {

    const circleA: Circle = <Circle>pair.shapeA;
    const circleB: Circle = <Circle>pair.shapeB;

    const normal: Vector = pair.normal;

    Vector.subtract(circleB.position, circleA.position, normal);

    const radius: number = circleA.radius + circleB.radius;

    const distSquared: number = normal.lengthSquared();

    if (distSquared > Math.pow(radius, 2)) return;

    pair.contactsCount = 1;

    if (distSquared === 0) {
        pair.normal.set(0, 1);
        
        circleA.position.clone(pair.contacts[0].vertex);
        pair.contacts[0].depth = radius;

        pair.isActive = true;
        return;
    }


    const dist: number = normal.length();

    pair.contacts[0].depth = radius - dist;
    normal.divide(dist)

    pair.normal.clone(Vector.temp[0]).scale(circleA.radius).add(circleA.position).clone(pair.contacts[0].vertex);

    pair.isActive = true;
}