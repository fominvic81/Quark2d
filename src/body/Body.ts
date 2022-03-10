import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Events } from '../common/Events';
import { Shape } from './shapes/Shape';
import { Joint } from '../joint/Joint';
import { Settings } from '../Settings';
import { Engine } from '../engine/Engine';
import { Pair } from '../Quark2d';
import { Island } from '../collision/island/IslandManager';

export interface BodyOptions {
    position?: Vector,
    angle?: number,
    /** A type of the body(dynamic, static or kinematic). */
    type?: BodyType,
    /**
     * A number that determines how fast the body slows down.
     * Must be from 0 to 1.
     */
    velocityDamping?: number,
    /** A variable which determines the body's ability to rotate */
    fixedRotation?: boolean,
    /** A variable which determines the body's ability to sleep */
    canSleep?: boolean,
    isBullet?: boolean,
}

export enum BodyType {
    dynamic,
    static,
    kinematic,
}

type BodyEventMap = {
    'add-shape': (data: {shape: Shape}) => void;
    'remove-shape': (data: {shape: Shape}) => void;
    'become-dynamic': (data: {previousType: BodyType}) => void;
    'become-static': (data: {previousType: BodyType}) => void;
    'become-kinematic': (data: {previousType: BodyType}) => void;
    'sleep-start': () => void;
    'sleep-end': () => void;
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
 * Static bodies do not collide with other static and kinematic bodies.
 * 
 * A kinematic bodies do not respond to forces and can't be moved by other bodies and behaves as if it has infinite mass.
 * Kinematic can be moved by setting its velocity.
 * Kinematic bodies do not collide with other kinematic and static bodies.
 * 
 * 
 * 
 * 
 * Events:
 * * add-shape
 * * remove-shape
 * * become-dynamic
 * * become-static
 * * become-kinematic
 * * sleep-start
 * * sleep-end
 * 
 */

export class Body<UserData = any> extends Events<BodyEventMap> {
    /** An id of the body */
    id: number = Common.nextId();
    /**
     * Set of shapes attached to the body.
     */
    shapes: Set<Shape> = new Set();
    /** @ignore */
    positionBias: Vector = new Vector();
    /** @ignore */
    positionBiasAngle: number = 0;
    /** Current angle of the body. */
    angle: number = 0;
    /** An angular velocity of the body. */
    angularVelocity: number = 0;
    /** A center mass of the body. */
    center: Vector = new Vector();
    /** Vector relative to which the shapes are attached. */
    position: Vector = new Vector();
    /** A linear velocity of the body. */
    velocity: Vector = new Vector();
    /** @ignore */
    dir: Vector = new Vector(1, 0);
    /** A type of the body(dynamic, static or kinematic). */
    type: BodyType = BodyType.dynamic;
    /**
     * A number that determines how fast the body slows down.
     * Must be in range 0...1.
     */
    velocityDamping: number = 0;
    /** The sum of masses of all shapes attached to the body. */
    mass: number = 0;
    /** A number equal to 1 / body.mass. */
    inverseMass: number = 0;
    /** The moment of inertia of the body. This determines how hard it is to rotate the body. */
    inertia: number = 0;
    /** A number equal to 1 / body.inertia. */
    inverseInertia: number = 0;
    /** A variable which determines this body's ability to spin */
    fixedRotation: boolean = false;
    /** The sum of areas of all shapes attached to the body. */
    area: number = 0;
    /**  */
    isSleeping: boolean = false;
    /** @ignore */
    sleepyTimer: number = 0;
    /** @ignore */
    motion: number = 0;
    /** A Set of all joints attached to the body */
    joints: Set<Joint> = new Set();
    /** A variable which determines the body's ability to sleep */
    canSleep: boolean = true;
    /** @ignore */
    engine?: Engine;
    /** A variable that contains user data */
    userData?: UserData;
    pairs: Map<number, Pair> = new Map();
    /** @ignore */
    visited: boolean = false;
    island?: Island;
    isBullet: boolean = false;
    /** @ignore */
    minTOI: number = 1;

    /** @ignore */
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
                case 'canSleep':
                    this.setAbilityToSleep(option[1]);
                    break;
                case 'isBullet':
                    this.isBullet = option[1];
                    break;
            }
        }
    }

    /**
     * Updates velocity of the body.
     * @param dt A delta time
     */
    updateVelocity (dt: number, gravity: Vector) {
        this.motion = this.velocity.lengthSquared() + Math.pow(this.angularVelocity, 2);

        // update velocity
        const rvd = (1 - this.velocityDamping);
        this.velocity.x = this.velocity.x * rvd + gravity.x * dt;
        this.velocity.y = this.velocity.y * rvd + gravity.y * dt;

        // update angularVelocity
        this.angularVelocity = this.angularVelocity * rvd;
    }

    /**
     * Updates position of the body.
     * @param dt A delta time
     */
    updatePosition (dt: number) {
        // update position
        this.translate(this.velocity.clone(Body.vecTemp[0]).scale(dt));

        // update angle
        this.rotate(this.angularVelocity * dt);

        // update AABB
        for (const shape of this.shapes) {
            shape.updateAABB();
        }
    }

    updateBias () {
        this.translate(this.positionBias);
        this.rotate(this.positionBiasAngle);
        this.positionBias.set(0, 0);
        this.positionBiasAngle = 0;
    }

    /**
     * Adds shape to the body.
     * @param shape
     */
    addShape (shape: Shape) {

        shape.updateAABB();

        shape.body = this;

        this.shapes.add(shape);

        this.updateArea();
        this.updateMass();

        this.updateCenterOfMass();

        this.updateInertia();

        this.engine?.manager.aabbTree.addShape(shape);

        this.trigger('add-shape', {shape});
        return shape;
    }

    /**
     * Adds shape to the body relatively to body`s position and angle.
     * @param shape
     */
    addShapeRelatively (shape: Shape, offset: Vector = new Vector(), angle: number = 0) {
        shape.rotate(this.angle + angle);
        shape.translate(offset.copy().add(this.position));
        return this.addShape(shape);
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

        this.trigger('remove-shape', {shape});

        this.engine?.manager.aabbTree.removeShape(shape);
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
    
        if (this.type === BodyType.dynamic && !this.fixedRotation) {
            for (const shape of this.shapes) {
                shape.updateInertia();
                const distSquared = Vector.distSquared(this.center, shape.center);
    
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
            Vector.subtract(this.center, shape.center, offset);
            sum.add(offset.clone(Vector.temp[2]).scale(shape.mass));
            mass += shape.mass;
        }

        const cm = sum.clone(Vector.temp[1]).divide(mass);

        Vector.subtract(this.center, cm, this.center);
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

        this.rotateU(Math.cos(angle), Math.sin(angle), angle);
    }

    rotateU (uX: number, uY: number, angle: number) {

        this.angle += angle;

        let dx = this.dir.x;
        let dy = this.dir.y;

        this.dir.x = dx * uX - dy * uY;
        this.dir.y = dx * uY + dy * uX;

        for (const shape of this.shapes) {
            shape.rotateAboutU(uX, uY, this.center);
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

        this.velocity.set(0, 0);
        this.angularVelocity = 0;
        this.positionBias.set(0, 0);
        this.positionBiasAngle = 0;

        if (type === BodyType.dynamic) {
            this.setSleeping(false);
            this.trigger('become-dynamic', {previousType});
        } else if (type === BodyType.static) {
            this.trigger('become-static', {previousType});
            this.minTOI = 1;
        } else if (type === BodyType.kinematic) {
            this.trigger('become-kinematic', {previousType});
            this.minTOI = 1;
        }
        this.updateMass();
        this.updateInertia();
    }

    /**
     * Sets 'isSleeping' to the given value
     * @param value
     */
    setSleeping (value: boolean) {
        const wasSleeping = this.isSleeping;
        this.isSleeping = value;

        if (this.isSleeping) {
            this.sleepyTimer = Settings.sleepyTime;

            this.positionBias.set(0, 0);
            this.positionBiasAngle = 0;

            this.velocity.set(0, 0);
            this.angularVelocity = 0;

            this.motion = 0;

            if (this.isSleeping !== wasSleeping) this.trigger('sleep-start');
        } else {
            this.sleepyTimer = 0;
            if (this.isSleeping !== wasSleeping) this.trigger('sleep-end');
        }
    }

    /**
     * Sets body.canSleep to the given value. If necessary awakens a body.
     * @param value
     */
    setAbilityToSleep (value: boolean) {
        this.canSleep = value;

        if (!value) {
            this.setSleeping(false);
        }
    }

    /**
     * Applies the given force to a body from the given offset(including resulting torque).
     * @param dt
     * @param force
     * @param offset
     */
    applyForce (dt: number, force: Vector, offset?: Vector) {
        this.velocity.x += force.x * this.inverseMass * dt;
        this.velocity.y += force.y * this.inverseMass * dt;
        if (offset) {
            this.angularVelocity += Vector.cross(offset, force) * this.inverseInertia * dt;
        }
        this.setSleeping(false);
    }

    /**
     * Applies the given impulse to a body from the given offset(including resulting angularVelocity).
     * @param impulse
     * @param offset
     */
    applyImpulse (impulse: Vector, offset?: Vector) {
        const velocity = impulse.clone(Body.vecTemp[0]).scale(this.inverseMass);
        this.velocity.add(velocity);

        if (offset) {
            const angularVelocity = Vector.cross(offset, impulse) * this.inverseInertia;
            this.angularVelocity += angularVelocity;
        }
    }

    /**
     * Sets the velocity of a body to the given.
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
        this.fixedRotation = value;
        this.updateInertia();
    }
}