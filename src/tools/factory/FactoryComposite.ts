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
            density: 500,
        }));
    
        const backWheel = new Body({position: new Vector(position.x - size, position.y + size * 0.5)});
        backWheel.addShape(new Circle({
            radius: 0.4 * size,
            filter: {group},
            density: 500,
        }));
    
        const frontConstraint = new DistanceConstraint({
            bodyA: car,
            bodyB: frontWheel,
            pointA: Vector.subtract(frontWheel.position, car.center, new Vector()),
            stiffness: 1,
        });
    
        const backConstraint = new DistanceConstraint({
            bodyA: car,
            bodyB: backWheel,
            pointA: Vector.subtract(backWheel.position, car.center, new Vector()),
            stiffness: 1,
        });
    
        composite.addBody(car, frontWheel, backWheel);
        composite.addConstraint(frontConstraint, backConstraint);
    
        return composite;
    }
}