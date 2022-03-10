import { ShapeType } from '../../../body/shapes/Shape';
import { CircleVsCircle } from './CircleVsCircle';
import { ConvexVsCircle } from './ConvexVsCircle';
import { EdgeVsCircle } from './EdgeVsCircle';
import { collide } from './Collision';

export const Colliders = {
    [ShapeType.CIRCLE | ShapeType.CIRCLE]: CircleVsCircle,
    [ShapeType.CONVEX | ShapeType.CIRCLE]: ConvexVsCircle,
    [ShapeType.CONVEX | ShapeType.CONVEX]: collide,
    [ShapeType.EDGE | ShapeType.CIRCLE]: EdgeVsCircle,
    [ShapeType.EDGE | ShapeType.CONVEX]: collide,
    [ShapeType.EDGE | ShapeType.EDGE]: collide,
};