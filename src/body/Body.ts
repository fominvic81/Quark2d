import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Events } from '../common/Events';
import { Sleeping, SleepingState } from './Sleeping';
import { Shape, ShapeType } from './shapes/Shape';
import { Vertices } from '../math/Vertices';
import { Convex } from './shapes/Convex';
import { Edge } from './shapes/Edge';

export interface BodyOptions {
    position?: Vector,
    angle?: number,
    mass?: number,
    density?: number,
    isStatic?: boolean,
    velocityDamping?: number,
    fixedRotation?: boolean,
}

/**
 * The bodies have position, angle, velocity, mass, area.
 * You can apply forces, impulses and add the shapes to the bodies.
 * The bodies can be static, or dynamic.
 */

export class Body {
    id: number = Common.nextId();
    name: string = 'body';
    shapes: Set<Shape> = new Set();
    events: Events = new Events();
    positionImpulse: Vector = new Vector();
    constraintImpulse: Vector = new Vector();
    constraintAngleImpulse: number = 0;
    contactsCount: number = 0;
    angularAcceleration: number = 0;
    angle: number = 0;
    anglePrev: number = 0;
    angularVelocity: number = 0;
    torque: number = 0;
    position: Vector = new Vector();
    positionPrev: Vector = new Vector();
    acceleration: Vector = new Vector();
    velocity: Vector = new Vector();
    force: Vector = new Vector();
    dir: Vector = new Vector(1, 0);
    constraintDir: Vector = new Vector(1, 0);
    constraintAngle: number = 0;
    isStatic: boolean = false;
    velocityDamping: number = 0;
    density: number = 100;
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

    private static vecTemp: Array<Vector> = [
        new Vector(),
    ];

    constructor (options: BodyOptions = {}) {
        this.set(options);
        
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
                case 'mass':
                    this.setMass(option[1]);
                    break;
                case 'density':
                    this.setDensity(option[1]);
                    break;
                case 'isStatic':
                    this.setStatic(option[1]);
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
        Vector.add(this.velocity.scale((1 - this.velocityDamping)), this.acceleration.scale(delta));

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

        // update bounds
        for (const shape of this.shapes) {
            shape.updateBounds();
        }
    }

    /**
     * Adds shape to the body.
     * @param shape
     * @param updateCenterOfMass
     * @param offset
     * @param angle
     */
    addShape (shape: Shape, updateCenterOfMass: boolean = false, offset: Vector = new Vector(), angle: number = 0) {

        shape.rotate(this.angle + angle);
        shape.translate(this.position);
        shape.translate(offset);

        shape.updateBounds();

        if (shape.type === ShapeType.CONVEX) {
            Vertices.translate((<Convex>shape).deltaVertices, offset);
        }

        shape.body = this;

        this.shapes.add(shape);

        this.updateArea();

        if (updateCenterOfMass) {
            this.updateCenterOfMass();
        }

        this.updateMass();
        this.updateInertia();

        this.events.trigger('add-shape', [{shape, updateCenterOfMass, offset, angle, body: this}])
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
        let inertia = 0;
    
        if (this.isStatic) {
            this.inertia = 0;
            this.inverseInertia = 0;
        } else {
            const inverseArea = 1/this.area;
            for(const shape of this.shapes) {

                const areaFraction = shape.area * inverseArea;
                const distSquared = Vector.distSquared(this.position, shape.position);
                const shapeInertia = (shape.inertia + distSquared) * areaFraction;
    
                inertia += shapeInertia;
            }
        }

        this.inertia = this.mass * inertia;
        this.inverseInertia = this.inertia === 0 ? 0 : 1 / this.inertia;
    }

    /**
     * Updates the mass of the body.
     */
    updateMass () {

        if (this.isStatic) {
            this.mass = 0;
            this.inverseMass = 0;
        } else {
            this.mass = this.area * this.density;
            this.inverseMass = this.mass === 0 ? 0 : (1 / this.mass);
        }
    }

    /**
     * Updates the center of mass of the body.
     */
    updateCenterOfMass () {
        const sum = Vector.temp[0];
        const offset = Vector.temp[1];
        sum.set(0, 0);
    
        for (const shape of this.shapes) {
            Vector.subtract(this.position, shape.position, offset);
            Vector.add(sum, offset.scale(shape.area, Vector.temp[2]));
        }
    
        const cm = sum.scale(1 / this.area, Vector.temp[1]);

        Vector.subtract(this.position, cm);
        for (const shape of this.shapes) {
            if (shape.type === ShapeType.CONVEX) {
                Vertices.translate((<Convex>shape).deltaVertices, cm);
            }
        }
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
        Vector.add(this.position, vector);

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

        for (const shape of this.shapes) {

            dx = shape.position.x - this.position.x;
            dy = shape.position.y - this.position.y;

            shape.position.x = dx * cos - dy * sin + this.position.x;
            shape.position.y = dx * sin + dy * cos + this.position.y;

            switch (shape.type) {
                case ShapeType.CONVEX:
                    vertices = (<Convex>shape).vertices;

                    for (const vertex of vertices) {
                        delta = (<Convex>shape).deltaVertices[vertex.index];
    
                        dx = delta.x;
                        dy = delta.y;
            
                        delta.x = dx * cos - dy * sin;
                        delta.y = dx * sin + dy * cos;
    
                        vertex.x = delta.x + this.position.x;
                        vertex.y = delta.y + this.position.y;
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

                    dx = shape.position.x - this.position.x;
                    dy = shape.position.y - this.position.y;

                    shape.position.x = dx * cos - dy * sin + this.position.x;
                    shape.position.y = dx * sin + dy * cos + this.position.y;

                    dx = (<Edge>shape).start.x - this.position.x;
                    dy = (<Edge>shape).start.y - this.position.y;

                    (<Edge>shape).start.x = dx * cos - dy * sin + this.position.x;
                    (<Edge>shape).start.y = dx * sin + dy * cos + this.position.y;

                    dx = (<Edge>shape).end.x - this.position.x;
                    dy = (<Edge>shape).end.y - this.position.y;

                    (<Edge>shape).end.x = dx * cos - dy * sin + this.position.x;
                    (<Edge>shape).end.y = dx * sin + dy * cos + this.position.y;

                    dx = (<Edge>shape).normal.x;
                    dy = (<Edge>shape).normal.y;
        
                    (<Edge>shape).normal.x = dx * cos - dy * sin;
                    (<Edge>shape).normal.y = dx * sin + dy * cos;

                    (<Edge>shape).normal.neg((<Edge>shape).ngNormal);
            }
        }
    }

    /**
     * Sets the mass of the body to the given. Updates the density and inertia.
     * @param mass
     */
    setMass (mass: number) {
        this.density = this.area === 0 ? 0 : mass / this.area;
        this.updateMass();
        this.updateInertia();
    }

    /**
     * Sets the density of the body to the given. Updates the mass and inertia.
     * @param mass
     */
    setDensity (density: number) {
        this.density = density;
        this.updateMass();
        this.updateInertia();
    }

    /**
     * Sets body.isStatic to the given value.
     * If value is true sets zero acceleration and velocity.
     * @param value
     */
    setStatic (value: boolean) {
        if (this.isStatic === value) return;
        this.isStatic = value;

        if (value) {
            this.acceleration.set(0, 0);
            this.velocity.set(0, 0);
            this.force.set(0, 0);
            this.angularAcceleration = 0;
            this.angularVelocity = 0;
            this.torque = 0;
            this.positionImpulse.set(0, 0);
            this.events.trigger('become-static');
        } else {
            this.setSleeping(SleepingState.AWAKE);
            this.events.trigger('become-dynamic');
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
            this.sleepyTimer = Sleeping.SLEEPY_TIME_LIMIT;

            this.positionImpulse.set(0, 0);
            this.velocity.set(0, 0);

            this.angularVelocity = 0;

            this.motion = 0;

            if (this.sleepState !== prevState) {
                this.events.trigger('sleep-start');
            }
        } else if (this.sleepState === SleepingState.AWAKE) {
            this.sleepyTimer = 0;
            if (this.sleepState !== prevState) {
                this.events.trigger('sleep-end');
            }
        }

    }

    /**
     * Applies the given force to a body from the given offset(including resulting torque).
     * @param force
     * @param offset
     */
    applyForce (force: Vector, offset?: Vector) {
        Vector.add(this.force, force);
        if (offset) {
            this.torque += Vector.cross(offset, force);
        }
    }

    /**
     * Applies the given impusle to a body from the given offset(including resulting angularVelocity).
     * @param force
     * @param offset
     */
    applyImpulse (impusle: Vector, offset?: Vector) {
        const velocity = impusle.scale(this.inverseMass, Body.vecTemp[0]);
        Vector.add(this.velocity, velocity);

        if (offset) {
            const angularVelocity = Vector.cross(offset, impusle) * this.inverseInertia;
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