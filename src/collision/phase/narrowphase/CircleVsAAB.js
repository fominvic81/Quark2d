import { Vector } from '../../../math/Vector';
import { Common } from '../../../common/Common';
import { Shape } from '../../../body/shapes/Shape';

export const CircleVsAAB = (shapePair) => {
    
    const a = shapePair.shapeA.type === Shape.CIRCLE;
    const shapeA = a ? shapePair.shapeA : shapePair.shapeB; // circle
    const shapeB = a ? shapePair.shapeB : shapePair.shapeA; // AAB
    const positionA = shapeA.getWorldPosition();
    const positionB = shapeB.getWorldPosition();

    const n = Vector.subtract(positionA, positionB, Vector.temp[0]);
    
    const closestPoint = Vector.clone(n, Vector.temp[1]);

    closestPoint.x = Common.clamp(closestPoint.x, -shapeB.width * 0.5, shapeB.width * 0.5);
    closestPoint.y = Common.clamp(closestPoint.y, -shapeB.height * 0.5, shapeB.height * 0.5);

    const inside = Common.contains(n.x, -shapeB.width * 0.5, shapeB.width * 0.5) &&
                   Common.contains(n.y, -shapeB.height * 0.5, shapeB.height * 0.5);

    if (inside) {
        if (shapeB.width * 0.5 - Math.abs(closestPoint.x) < shapeB.height * 0.5 - Math.abs(closestPoint.y)) {
            closestPoint.x = shapeB.width * 0.5 * Common.sign(closestPoint.x);
        } else {
            closestPoint.y = shapeB.height * 0.5 * Common.sign(closestPoint.y);
        }
    }

    Vector.add(closestPoint, positionB);
    Vector.subtract(positionA, closestPoint, shapePair.normal);

    const distSquared = Vector.lengthSquared(shapePair.normal);

    if (distSquared === 0) {
        return shapePair;
    }

    const radiusSquared = Math.pow(shapeA.radius, 2);

    if (radiusSquared < distSquared && !inside) {
        return shapePair;
    }
 
    const dist = Math.sqrt(distSquared);
    
    if (radiusSquared < distSquared) {
        shapePair.depth = shapeA.radius + dist;
    } else {
        shapePair.depth = shapeA.radius - dist;
    }

    Vector.divide(shapePair.normal, dist);

    // if (a) Vector.neg(shapePair.normal);
    // if (inside) Vector.neg(shapePair.normal);
    // ||                                    ||
    // \/                                    \/
    if (inside !== a) Vector.neg(shapePair.normal);

    shapePair.contactsCount = 1;
    Vector.clone(closestPoint, shapePair.contacts[0].vertex);
    
    shapePair.isActive = true;
    return shapePair;

}