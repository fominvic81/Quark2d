import { Shape } from '../../../body/shapes/Shape';
import { CircleVsCircle } from './CircleVsCircle';
import { ConvexVsConvex } from './ConvexVsConvex';
import { ConvexVsCircle } from './ConvexVsCircle';

export const Colliders = {};

Colliders[Shape.CIRCLE | Shape.CIRCLE] = CircleVsCircle;
Colliders[Shape.CONVEX | Shape.CIRCLE] = ConvexVsCircle;
Colliders[Shape.CONVEX | Shape.CONVEX] = ConvexVsConvex;