import { Shape } from '../../../body/shapes/Shape';
import { CircleVsCircle } from './CircleVsCircle';
import { ConvexVsCircle } from './ConvexVsCircle';
import { EdgeVsCircle } from './EdgeVsCircle';
import { collide } from './Collision';

export const Colliders = {};

Colliders[Shape.CIRCLE | Shape.CIRCLE] = CircleVsCircle;
Colliders[Shape.CONVEX | Shape.CIRCLE] = ConvexVsCircle;
Colliders[Shape.CONVEX | Shape.CONVEX] = collide;
Colliders[Shape.EDGE | Shape.CIRCLE] = EdgeVsCircle;
Colliders[Shape.EDGE | Shape.CONVEX] = collide;
Colliders[Shape.EDGE | Shape.EDGE] = collide;