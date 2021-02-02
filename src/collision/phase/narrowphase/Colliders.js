import { Shape } from '../../../body/shapes/Shape';
import { CircleVsCircle } from './CircleVsCircle';
import { ConvexVsConvex } from './ConvexVsConvex';
import { ConvexVsCircle } from './ConvexVsCircle';
import { EdgeVsCircle } from './EdgeVsCircle';
import { EdgeVsConvex } from './EdgeVsConvex';
import { EdgeVsEdge } from './EdgeVsEdge';

export const Colliders = {};

Colliders[Shape.CIRCLE | Shape.CIRCLE] = CircleVsCircle;
Colliders[Shape.CONVEX | Shape.CIRCLE] = ConvexVsCircle;
Colliders[Shape.CONVEX | Shape.CONVEX] = ConvexVsConvex;
Colliders[Shape.EDGE | Shape.CIRCLE] = EdgeVsCircle;
Colliders[Shape.EDGE | Shape.CONVEX] = EdgeVsConvex;
Colliders[Shape.EDGE | Shape.EDGE] = EdgeVsEdge;