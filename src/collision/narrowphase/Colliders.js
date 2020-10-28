import { Shape } from '../../body/shapes/Shape';
import { AABVsAAB } from './AABVsAAB';
import { CircleVsAAB } from './CircleVsAAB';
import { CircleVsCircle } from './CircleVsCircle';
import { ConvexVsConvex } from './ConvexVsConvex';
import { ConvexVsCircle } from './ConvexVsCircle';
import { ConvexVsAAB } from './ConvexVsAAB';

export const Colliders = {};

Colliders[Shape.AAB | Shape.AAB] = AABVsAAB;
Colliders[Shape.CIRCLE | Shape.AAB] = CircleVsAAB;
Colliders[Shape.CIRCLE | Shape.CIRCLE] = CircleVsCircle;
Colliders[Shape.CONVEX | Shape.AAB] = ConvexVsAAB;
Colliders[Shape.CONVEX | Shape.CIRCLE] = ConvexVsCircle;
Colliders[Shape.CONVEX | Shape.CONVEX] = ConvexVsConvex;