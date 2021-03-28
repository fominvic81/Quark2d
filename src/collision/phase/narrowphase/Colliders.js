import { ShapeType } from '../../../body/shapes/Shape';
import { CircleVsCircle } from './CircleVsCircle';
import { ConvexVsCircle } from './ConvexVsCircle';
import { EdgeVsCircle } from './EdgeVsCircle';
import { collide } from './Collision';

export const Colliders = {};

Colliders[ShapeType.CIRCLE | ShapeType.CIRCLE] = CircleVsCircle;
Colliders[ShapeType.CONVEX | ShapeType.CIRCLE] = ConvexVsCircle;
Colliders[ShapeType.CONVEX | ShapeType.CONVEX] = collide;
Colliders[ShapeType.EDGE | ShapeType.CIRCLE] = EdgeVsCircle;
Colliders[ShapeType.EDGE | ShapeType.CONVEX] = collide;
Colliders[ShapeType.EDGE | ShapeType.EDGE] = collide;