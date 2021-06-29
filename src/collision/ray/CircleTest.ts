import { Vector } from '../../math/Vector';

const temp = new Vector();
export const circleTest = (from: Vector, delta: Vector, position: Vector, radius: number) => {
    const posDelta = Vector.subtract(from, position, temp);

    const a = delta.lengthSquared();
    const b = 2 * Vector.dot(delta, posDelta);
    const c = posDelta.lengthSquared() - Math.pow(radius, 2);
    const d = Math.pow(b, 2) - 4 * a * c;

    if (d < 0) {
        return Infinity;
    }

    const dSqrt = Math.sqrt(d);
    const fraction = (-b - dSqrt) / (2 * a);

    if (fraction >= 0 && fraction <= 1) {
        return fraction;
    }

    return Infinity;
}