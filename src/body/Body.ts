import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Events } from '../common/Events';
import { SleepingState } from './Sleeping';
import { Shape, ShapeType } from './shapes/Shape';
import { Convex } from './shapes/Convex';
import { Edge } from './shapes/Edge';
import { Constraint } from '../constraint/Constraint';
import { Settings } from '../Settings';
import { Engine } from '../engine/Engine';

export interface BodyOptions {
    position?: Vector,
    angle?: number,
    mass?: number,
    type?: BodyType,
    velocityDamping?: number,
    fixedRotation?: boolean,
}

export enum BodyType {
    dynamic,
    static,
    kinematic,
}

/**
 * The bodies have position, angle, velocity.
 * You can apply forces, impulses and add the shapes to the bodies.
 * The bodies can be dynamic, static or kinematic.
 * 
 * A dynamic bodies normally move according to forces but can be moved manually by the user.
 * Dynamic bodies collide with all body types.
 * You can set the mass of the dynamic bodies, but it can't be zero.
 * 
 * A static bodies do not respond to forces and can't be moved by other bodies and behaves as if it has infinite mass.
 * Static bodies can be moved manually by the user.
 * Static bodies do not collide with other static and kinematic bodies.
 * 
 * A kinematic bodies do not respond to forces and can't be moved by other bodies and behaves as if it has infinite mass.
 * Kinematic can be moved manually by the user, but normally it must be moved by setting its velocity.
 * Kinematic bodies do not collide with other kinematic and static bodies.
 */

export class Body<UserData = any> extends Events {
    id: number = Common.nextId();
    name: string = 'body';
    shapes: Set<Shape> = new Set();
    positionImpulse: Vector = new Vector();
    constraintImpulse: Vector = new Vector();
    constraintAngleImpulse: number = 0;
    pairsCount: number = 0;
    angularAcceleration: number = 0;
    angle: number = 0;
    anglePrev: number = 0;
    angularVelocity: number = 0;
    torque: number = 0;
    center: Vector = new Vector();
    position: Vector = new Vector();
    positionPrev: Vector = new Vector();
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    force: Vector = new Vector();
    dir: Vector = new Vector(1, 0);
    constraintDir: Vector = new Vector(1, 0);
    constraintAngle: number = 0;
    type: BodyType = BodyType.dynamic;
    velocityDamping: number = 0;
    mass: number = 0;
    inverseMass: number = 0;
    inertia: number = 0;
    inverseInertia: number = 0;
    area: number = 0;
    sleepState: SleepingState = SleepingState.AWAKE;
    sleepyTimer: number = 0;
    motion: number = 0;
    speedSquared: number = 0;
    angSpeedSquared: number = 0;
    constraints: Set<Constraint> = new Set();
    engine?: Engine;
    userData?: UserData;

    private static vecTemp: Vector[] = [
        new Vector(),
    ];

    constructor (options: BodyOptions = {}, userData?: UserData) {
        super();
        this.set(options);

        this.userData = userData;

        this.updateArea();
        this.updateMass();
        this.updateInertia();
    }


    set (options: BodyOptions) {
        for (const option of Object.entries(options)) {
            switch (option[0]) {
                case 'position':
                    this.setPosition(option[1]);
                    break;
                case 'angle':
                    this.setAngle(option[1]);
                    break;
                case 'type':
                    this.setType(option[1]);
                    break;
                case 'velocityDamping':
                    this.velocityDamping = option[1];
                    break;
                case 'fixedRotation':
                    this.setFixedRotation(option[1]);
                    break;
            }
        }
    }

    /**
     * Updates acceleration and velocity of the body.
     * @param delta The delta time
     */
    updateVelocity (delta: number) {
        this.speedSquared = this.velocity.lengthSquared();
        this.angSpeedSquared = Math.pow(this.angularVelocity, 2);
        this.motion = this.speedSquared + this.angSpeedSquared;

        // update acceleration
        this.force.scale(this.inverseMass * delta, this.acceleration);

        // update velocity
        this.velocity.scale((1 - this.velocityDamping)).add(this.acceleration.scale(delta));

        // update angularAcceleration
        this.angularAcceleration = this.torque * this.inverseInertia * delta;

        // update angularVelocity
        this.angularVelocity = this.angularVelocity * (1 - this.velocityDamping) + this.angularAcceleration * delta;

        // clear forces
        this.force.set(0, 0);
        this.torque = 0;
    }

    /**
     * Updates position of the body.
     */
    updatePosition () {
        // update position 
        this.position.clone(this.positionPrev);
        this.translate(this.velocity);

        // update angle
        this.anglePrev = this.angle;
        this.rotate(this.angularVelocity);

        // update AABB
        for (const shape of this.shapes) {
            shape.updateAABB();
        }
    }

    /**
     * Adds shape to the body.
     * @param shape
     * @param updateCenterOfMass
     * @param offset
     * @param angle
     */
    addShape (shape: Shape, offset: Vector = new Vector(), angle: number = 0) {

        shape.rotate(this.angle + angle);
        shape.translate(this.position);
        shape.translate(offset);

        shape.updateAABB();

        shape.body = this;

        this.shapes.add(shape);

        this.updateArea();
        this.updateMass();

        this.updateCenterOfMass();

        this.updateInertia();

        this.engine?.manager.broadphase.addShape(shape);

        this.trigger('add-shape', [{shape, body: this}]);
        return shape;
    }

    /**
     * Removes shape from body.
     * @param shape
     */
    removeShape (shape: Shape) {
        this.shapes.delete(shape);
        shape.body = undefined;

        this.updateArea();
        this.updateMass();

        this.updateCenterOfMass();

        this.updateInertia();

        this.trigger('remove-shape', [{shape, body: this}]);

        this.engine?.manager.broadphase.removeShape(shape);
        return shape;
    }

    /**
     * Updates the area of the body.
     */
    updateArea () {
        this.area = 0;

        for (const shape of this.shapes) {
            this.area += shape.area;
        }
    }

    /**
     * Updates the inertia of the body.
     */
    updateInertia () {
        this.inertia = 0;
    
        if (this.type === BodyType.dynamic) {
            for (const shape of this.shapes) {
                shape.updateInertia();
                const distSquared = Vector.distSquared(this.center, shape.position);
    
                this.inertia += shape.inertia + distSquared * shape.mass;
            }
        } else {
            this.inertia = 0;
            this.inverseInertia = 0;
        }

        this.inverseInertia = this.inertia === 0 ? 0 : 1 / this.inertia;
    }

    /**
     * Updates the mass of the body.
     */
    updateMass () {

        if (this.type === BodyType.dynamic) {
            this.mass = 0;
            for (const shape of this.shapes) {
                this.mass += shape.mass;
            }

            this.inverseMass = this.mass === 0 ? 0 : (1 / this.mass);
        } else {
            this.mass = 0;
            this.inverseMass = 0;
        }
    }

    /**
     * Updates the center of mass of the body.
     */
    updateCenterOfMass () {
        const sum = Vector.temp[0];
        const offset = Vector.temp[1];
        sum.set(0, 0);
        let mass = 0;
        
        for (const shape of this.shapes) {
            Vector.subtract(this.center, shape.position, offset);
            sum.add(offset.scale(shape.mass, Vector.temp[2]));
            mass += shape.mass;
        }

        const cm = sum.divide(mass, Vector.temp[1]);

        Vector.subtract(this.center, cm, this.center);
        for (const shape of this.shapes) {
            if (shape.type === ShapeType.CONVEX) {
                const convex = <Convex>shape;
                for (const vertex of convex.vertices) {
                    Vector.subtract(vertex, this.center, convex.deltaVertices[vertex.index]);
                }
            }
        }
        this.updateInertia();
    }

    /**
     * Sets the position of the body to the given.
     * @param position
     */
    setPosition (position: Vector) {
        this.translate(Vector.subtract(position, this.position, Body.vecTemp[0]));
    }

    /**
     * Translates the body by the given vector.
     * @param vector
     */
    translate (vector: Vector) {
        this.position.add(vector);
        this.center.add(vector);

        for (const shape of this.shapes) {
            shape.translate(vector);
        }
    }

    /**
     * Sets the angle of the body to the given.
     * @param angle
     */
    setAngle (angle: number) {
        this.rotate(angle - this.angle);
    }

    /**
     * Rotates the body by the given angle.
     * @param angle
     */
    rotate (angle: number) {

        if (angle === 0) return;

        this.angle += angle;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let vertices;
        let dx = this.dir.x;
        let dy = this.dir.y;
        let delta;
        let normals;

        this.dir.x = dx * cos - dy * sin;
        this.dir.y = dx * sin + dy * cos;

        this.constraintDir.x = this.dir.x;
        this.constraintDir.y = this.dir.y;
        this.constraintAngle = this.angle;

        for (const shape of this.shapes) {

            dx = shape.position.x - this.center.x;
            dy = shape.position.y - this.center.y;

            shape.position.x = dx * cos - dy * sin + this.center.x;
            shape.position.y = dx * sin + dy * cos + this.center.y;

            switch (shape.type) {
                case ShapeType.CONVEX:
                    vertices = (<Convex>shape).vertices;

                    for (const vertex of vertices) {
                        delta = (<Convex>shape).deltaVertices[vertex.index];

                        dx = delta.x;
                        dy = delta.y;
            
                        delta.x = dx * cos - dy * sin;
                        delta.y = dx * sin + dy * cos;
    
                        vertex.x = delta.x + this.center.x;
                        vertex.y = delta.y + this.center.y;
                    }
    
                    normals = (<Convex>shape).normals;
    
                    for (const normal of normals) {
                        dx = normal.x;
                        dy = normal.y;
            
                        normal.x = dx * cos - dy * sin;
                        normal.y = dx * sin + dy * cos;
                    }
                    break;
                case ShapeType.EDGE:

                    dx = shape.position.x - this.center.x;
                    dy = shape.position.y - this.center.y;

                    shape.position.x = dx * cos - dy * sin + this.center.x;
                    shape.position.y = dx * sin + dy * cos + this.center.y;

                    dx = (<Edge>shape).start.x - this.center.x;
                    dy = (<Edge>shape).start.y - this.center.y;

                    (<Edge>shape).start.x = dx * cos - dy * sin + this.center.x;
                    (<Edge>shape).start.y = dx * sin + dy * cos + this.center.y;

                    dx = (<Edge>shape).end.x - this.center.x;
                    dy = (<Edge>shape).end.y - this.center.y;

                    (<Edge>shape).end.x = dx * cos - dy * sin + this.center.x;
                    (<Edge>shape).end.y = dx * sin + dy * cos + this.center.y;

                    dx = (<Edge>shape).normal.x;
                    dy = (<Edge>shape).normal.y;
        
                    (<Edge>shape).normal.x = dx * cos - dy * sin;
                    (<Edge>shape).normal.y = dx * sin + dy * cos;
            }
        }
    }

    /**
     * Sets body's type to the given.
     * @param value
     */
    setType (type: BodyType) {
        if (this.type === type) return;
        const previousType = this.type;
        this.type = type;

        this.acceleration.set(0, 0);
        this.velocity.set(0, 0);
        this.force.set(0, 0);
        this.angularAcceleration = 0;
        this.angularVelocity = 0;
        this.torque = 0;
        this.positionImpulse.set(0, 0);

        if (type === BodyType.dynamic) {
            this.setSleeping(SleepingState.AWAKE);
            this.trigger('become-dynamic', [{previousType}]);
        } else if (type === BodyType.static) {
            this.trigger('become-static', [{previousType}]);
        } else if (type === BodyType.kinematic) {
            this.trigger('become-kinematic', [{previousType}]);
        }
        this.updateMass();
        this.updateInertia();
    }

    /**
     * Sets sleeping state to the given value
     * @param value
     */
    setSleeping (value: SleepingState) {
        const prevState = this.sleepState;
        this.sleepState = value;

        if (this.sleepState === SleepingState.SLEEPING) {
            this.sleepyTimer = Settings.sleepyTime;

            this.positionImpulse.set(0, 0);
            this.velocity.set(0, 0);

            this.angularVelocity = 0;

            this.motion = 0;

            if (this.sleepState !== prevState) {
                this.trigger('sleep-start');
            }
        } else if (this.sleepState === SleepingState.AWAKE) {
            this.sleepyTimer = 0;
            if (this.sleepState !== prevState) {
                this.trigger('sleep-end');
            }
        }

    }

    /**
     * Applies the given force to a body from the given offset(including resulting torque).
     * @param force
     * @param offset
     */
    applyForce (force: Vector, offset?: Vector) {
        this.force.add(force);
        if (offset) {
            this.torque += Vector.cross(offset, force);
        }
    }

    /**
     * Applies the given impulse to a body from the given offset(including resulting angularVelocity).
     * @param force
     * @param offset
     */
    applyImpulse (impulse: Vector, offset?: Vector) {
        const velocity = impulse.scale(this.inverseMass, Body.vecTemp[0]);
        this.velocity.add(velocity);

        if (offset) {
            const angularVelocity = Vector.cross(offset, impulse) * this.inverseInertia;
            this.angularVelocity += angularVelocity;
        }
    }

    /**
     * Sets the velosity of a body to the given.
     * @param velocity
     */
    setVelocity (velocity: Vector) {
        velocity.clone(this.velocity);
    }

    /**
     * Sets the body's ability to rotate to the given value.
     * @param value
     */
    setFixedRotation (value: boolean) {
        if (value) {
            this.inertia = 0;
            this.inverseInertia = 0;
        } else {
            this.updateInertia();
        }
    }
}