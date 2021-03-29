import { Circle } from '../../../body/shapes/Circle';
import { Edge } from '../../../body/shapes/Edge';
import { ShapeType } from '../../../body/shapes/Shape';
import { Vector } from '../../../math/Vector';
import { ShapePair } from '../../pair/ShapePair';


export const EdgeVsCircle = (shapePair: ShapePair) => {

    const flipped: boolean = shapePair.shapeA.type === ShapeType.EDGE;
    const edge: Edge = <Edge>(flipped ? shapePair.shapeA : shapePair.shapeB);
    const circle: Circle = <Circle>(flipped ? shapePair.shapeB : shapePair.shapeA);

    const temp0: Vector = Vector.temp[0];

    const normal: Vector = shapePair.normal;

    const radius: number = edge.radius + circle.radius;
    const edgeLength: number = edge.length;

    Vector.subtract(edge.start, circle.position, normal);

    const dot: number = Vector.cross(edge.normal, normal);

    if (dot > edgeLength) {
        Vector.subtract(edge.end, circle.position, normal);

        const distSquared: number = normal.lengthSquared();

        if (distSquared > Math.pow(radius, 2)) {
            return;
        }

        const dist: number = Math.sqrt(distSquared);

        normal.divide(dist);
        shapePair.depth = radius - dist;

    } else if (dot < 0) {
        const distSquared: number = normal.lengthSquared();

        if (distSquared > Math.pow(radius, 2)) {
            return;
        }

        const dist: number = Math.sqrt(distSquared);

        normal.divide(dist);
        shapePair.depth = radius - dist;
    } else {

        const eDot: number = Vector.dot(edge.start, edge.normal);
        const cDot: number = Vector.dot(circle.position, edge.normal);

        const dist: number = eDot - cDot;

        if (dist > 0) {
            if (dist > radius) {
                return;
            }
            shapePair.depth = radius - dist;
            edge.normal.clone(normal);
        } else {
            if (dist < -radius) {
                return;
            }
            shapePair.depth = radius + dist;
            edge.normal.neg(normal);
        }

    }

    shapePair.contactsCount = 1;
    Vector.add(normal.scale(circle.radius, temp0), circle.position).clone(shapePair.contacts[0].vertex);

    if (flipped) {
        normal.neg();
    }

    shapePair.isActive = true;
    return;
}