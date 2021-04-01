import { Composite } from '../../common/Composite';
import { Vector } from '../../math/Vector';
import { Body } from '../../body/Body';
import { Circle } from '../../body/shapes/Circle';
import { Convex } from '../../body/shapes/Convex';
import { Filter } from '../../body/Filter';
import { DistanceConstraint } from '../../constraint/DistanceConstraint';

export class FactoryComposite {
    static car (position: Vector, size: number = 1, composite: Composite = new Composite()): Composite {

        const group = Filter.nextGroup(true);
    
        const car = new Body({position});
        car.addShape(new Convex({
            vertices: [
                new Vector(-1.5 * size, -0.2 * size),
                new Vector(-1.2 * size, -0.9 * size),
                new Vector(0.0, -0.9 * size),
                new Vector(1.5 * size, 0.0),
                new Vector(1.5 * size, 0.5 * size),
                new Vector(-1.5 * size, 0.5 * size),
            ],
            filter: {group},
        }));
    
        const frontWheel = new Body({position: new Vector(position.x + size, position.y + size * 0.5)});
        frontWheel.addShape(new Circle({
            radius: 0.4 * size,
            filter: {group},
        }));
    
        const backWheel = new Body({position: new Vector(position.x - size, position.y + size * 0.5)});
        backWheel.addShape(new Circle({
            radius: 0.4 * size,
            filter: {group},
        }));
    
        const frontConstraint = new DistanceConstraint({
            bodyA: car,
            bodyB: frontWheel,
            pointA: new Vector(size, 0.5 * size),
            stiffness: 1,
        });
    
        const backConstraint = new DistanceConstraint({
            bodyA: car,
            bodyB: backWheel,
            pointA: new Vector(-size, 0.5 * size),
            stiffness: 1,
        });
    
        composite.addBody([car, frontWheel, backWheel]);
        composite.addConstraint([frontConstraint, backConstraint]);
    
        return composite;
    }
    
    static newtonsCradle (position: Vector, count: number, radius: number, length: number, leftCount: number = 1, rightCount: number = 0, composite: Composite = new Composite()): Composite {
    
        const halfWidth = radius * count - radius;
        const halfHeight = length / 2 + radius;
    
        for (let i = 0; i < count; ++i) {
    
            const circle = new Body({
                position: new Vector(
                    i * radius * 2 + position.x - halfWidth,
                    position.y + halfHeight,
                ),
                velocityDamping: 0,
            });
            circle.addShape(new Circle({
                radius,
                inertia: Infinity,
                restitution: 1,
                friction: 0,
            }));
    
            if (i < leftCount) {
                circle.translate(new Vector(-halfHeight * 2, -halfHeight * 2));
            } else if (i > count - rightCount - 1) {
                circle.translate(new Vector(halfHeight * 2, -halfHeight * 2));
            }
            
            const constraint = new DistanceConstraint({
                bodyA: circle,
                pointB: new Vector(i * radius * 2 + position.x - halfWidth, position.y - halfHeight),
                stiffness: 1,
            });
    
            composite.addBody(circle);
            composite.addConstraint(constraint);
        }
    
        return composite;
    }
}