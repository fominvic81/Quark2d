import { Vector } from '../../../math/Vector';
import { Common } from '../../../common/Common';


export const AABVsAAB = (shapePair) => {
    
    const shapeA = shapePair.shapeA;
    const shapeB = shapePair.shapeB;
    const positionA = shapeA.getWorldPosition();
    const positionB = shapeB.getWorldPosition();

    const n = Vector.subtract(positionA, positionB, Vector.temp[0]);
    
    const x_overlap = (shapeA.width + shapeB.width) / 2 - Math.abs(n.x);
    const y_overlap = (shapeA.height + shapeB.height) / 2 - Math.abs(n.y);

    if(x_overlap > 0 && y_overlap > 0) {
        shapePair.isActive = true;
    }

    shapePair.contactsCount = 2;
    if (x_overlap < y_overlap) {
        shapePair.depth = x_overlap;
        Vector.set(shapePair.normal, -Common.sign(n.x), 0);

        // find contacts
        Vector.set(shapePair.contacts[0].vertex,
            positionA.x - (shapeA.width / 2 * Common.sign(n.x)),
            Math.max(positionA.y - (shapeA.height / 2), positionB.y - (shapeB.height / 2)),    
        );

        Vector.set(shapePair.contacts[1].vertex,
            positionA.x - (shapeA.width / 2 * Common.sign(n.x)),
            Math.min(positionA.y + (shapeA.height / 2), positionB.y + (shapeB.height / 2)),    
        );

    } else {
        shapePair.depth = y_overlap;
        Vector.set(shapePair.normal, 0, -Common.sign(n.y));

        // find contacts
        Vector.set(shapePair.contacts[0].vertex,
            Math.max(positionA.x - (shapeA.width / 2), positionB.x - (shapeB.width / 2)),    
            positionA.y - (shapeA.height / 2 * Common.sign(n.y)),
        );

        Vector.set(shapePair.contacts[1].vertex,
            Math.min(positionA.x + (shapeA.width / 2), positionB.x + (shapeB.width / 2)),    
            positionA.y - (shapeA.height / 2 * Common.sign(n.y)),
        );
    }
    

    return shapePair;
}