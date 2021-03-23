import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Events } from '../common/Events';
import { Sleeping } from './Sleeping';
import { Shape } from './shapes/Shape';
import { Vertices } from '../math/Vertices';


export class Body {

    constructor (options = {}) {
        this.id = Common.nextId();
        this.name = 'body';
        this.shapes = [];
        this.events = new Events();
        this.positionImpulse = new Vector();
        this.constraintImpulse = new Vector();
        this.constraintImpulse.angle = 0;
        this.contactsCount = 0;
        this.angularAcceleration = 0;
        this.angle = 0;
        this.anglePrev = 0;
        this.angularVelocity = 0;
        this.torque = 0;
        this.position = new Vector();
        this.positionPrev = new Vector();
        this.acceleration = new Vector();
        this.velocity = new Vector();
        this.force = new Vector();
        this.dir = new Vector(Math.cos(this.angle), Math.sin(this.angle));
        this.constraintDir = Vector.clone(this.dir);
        this.constraintAngle = this.angle;
        this.isStatic = false;
        this.velocityDamping = 0;
        this.density = 100;
        this.mass = 0;
        this.inverseMass = 0;
        this.inertia = 0;
        this.inverseInertia = 0;
        this.area = 0;
        this.sleepState = Sleeping.AWAKE;
        this.sleepyTimer = 0;
        this.motion = 0;
        this.speedSquared = 0;
        this.angSpeedSquared = 0;

        this.set(options);
        
        this.updateArea();
        this.updateMass();
        this.updateInertia();
    }

    set (options) {
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

    updateVelocity (delta) {
        this.speedSquared = Vector.lengthSquared(this.velocity);
        this.angSpeedSquared = Math.pow(this.angularVelocity, 2);
        this.motion = this.speedSquared + this.angSpeedSquared;

        // update acceleration
        Vector.scale(this.force, this.inverseMass * delta, this.acceleration);

        // update velocity
        Vector.add(Vector.scale(this.velocity, (1 - this.velocityDamping)), Vector.scale(this.acceleration, delta));

        // update angularAcceleration
        this.angularAcceleration = this.torque * this.inverseInertia * delta;

        // update angularVelocity
        this.angularVelocity = this.angularVelocity * (1 - this.velocityDamping) + this.angularAcceleration * delta;

        // clear forces
        Vector.set(this.force, 0, 0);
        this.torque = 0;
    }

    updatePosition () {
        // update position 
        Vector.clone(this.position, this.positionPrev);
        this.translate(this.velocity);

        // update angle
        this.anglePrev = this.angle;
        this.rotate(this.angularVelocity);

        // update bounds
        for (const shape of this.shapes) {
            shape.updateBounds();
        }
    }

    addShape (shape, updateCenterOfMass = false, offset = new Vector(), angle = 0) {

        shape.rotate(this.angle + angle);
        shape.translate(this.position);
        shape.translate(offset);

        shape.updateBounds();

        if (shape.type === Shape.CONVEX) {
            Vertices.translate(shape.deltaVertices, offset);
        }

        shape.body = this;

        this.shapes.push(shape);

        this.updateArea();

        if (updateCenterOfMass) {
            this.updateCenterOfMass();
        }

        this.updateMass();
        this.updateInertia();

        this.events.trigger('add-shape', [{shape, updateCenterOfMass, offset, angle, body: this}])
    }

    updateArea () {
        
        this.area = 0;
        
        for (const shape of this.shapes) {
            this.area += shape.area;
        }
        
    }

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
    
    updateMass () {

        if (this.isStatic) {
            this.mass = 0;
            this.inverseMass = 0;
        } else {
            this.mass = this.area * this.density;
            this.inverseMass = this.mass === 0 ? 0 : (1 / this.mass);
        }
    }

    updateCenterOfMass () {
        const sum = Vector.temp[0];
        const offset = Vector.temp[1];
        Vector.set(sum, 0, 0);
    
        for (const shape of this.shapes){
            Vector.subtract(this.position, shape.position, offset);
            Vector.add(sum, Vector.scale(offset, shape.area, Vector.temp[2]));
        }
    
        const cm = Vector.scale(sum, 1 / this.area, Vector.temp[1]);

        Vector.subtract(this.position, cm);
        for (const shape of this.shapes) {
            if (shape.type === Shape.CONVEX) {
                Vertices.translate(shape.deltaVertices, cm);
            }
        }
    }

    setPosition (position) {
        this.translate(Vector.subtract(position, this.position, Body.vecTemp[0]));
    }

    translate (offset) {
        Vector.add(this.position, offset);

        for (const shape of this.shapes) {
            shape.translate(offset);
        }
    }

    setAngle (angle) {
        this.rotate(angle - this.angle);
    }

    rotate (angle) {

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
                case Shape.CONVEX:
                    vertices = shape.vertices;

                    for (const vertex of vertices) {
                        delta = shape.deltaVertices[vertex.index];
    
                        dx = delta.x;
                        dy = delta.y;
            
                        delta.x = dx * cos - dy * sin;
                        delta.y = dx * sin + dy * cos;
    
                        vertex.x = delta.x + this.position.x;
                        vertex.y = delta.y + this.position.y;
                    }
    
                    normals = shape.normals;
    
                    for (const normal of normals) {
                        dx = normal.x;
                        dy = normal.y;
            
                        normal.x = dx * cos - dy * sin;
                        normal.y = dx * sin + dy * cos;
                    }
                    break;
                case Shape.EDGE:

                    dx = shape.position.x - this.position.x;
                    dy = shape.position.y - this.position.y;

                    shape.position.x = dx * cos - dy * sin + this.position.x;
                    shape.position.y = dx * sin + dy * cos + this.position.y;

                    dx = shape.start.x - this.position.x;
                    dy = shape.start.y - this.position.y;

                    shape.start.x = dx * cos - dy * sin + this.position.x;
                    shape.start.y = dx * sin + dy * cos + this.position.y;

                    dx = shape.end.x - this.position.x;
                    dy = shape.end.y - this.position.y;

                    shape.end.x = dx * cos - dy * sin + this.position.x;
                    shape.end.y = dx * sin + dy * cos + this.position.y;

                    dx = shape.normal.x;
                    dy = shape.normal.y;
        
                    shape.normal.x = dx * cos - dy * sin;
                    shape.normal.y = dx * sin + dy * cos;

                    Vector.neg(shape.normal, shape.ngNormal);
            }
        }
    }

    setMass (mass) {
        this.density = this.area === 0 ? 0 : mass / this.area;
        this.updateMass();
        this.updateInertia();
    }

    setDensity (density) {
        this.density = density;
        this.updateMass();
        this.updateInertia();
    }

    setStatic (value) {
        if (this.isStatic === value) return;
        this.isStatic = value;

        if (value) {
            Vector.set(this.acceleration, 0, 0);
            Vector.set(this.velocity, 0, 0);
            Vector.set(this.force, 0, 0);
            this.angularAcceleration = 0;
            this.angularVelocity = 0;
            this.torque = 0;
            Vector.set(this.positionImpulse, 0, 0);
            this.events.trigger('become-static');
        } else {
            this.setSleeping(Sleeping.AWAKE);
            this.events.trigger('become-dynamic');
        }
        this.updateMass();
        this.updateInertia();
    }

    setSleeping (value) {
        const prevState = this.sleepState;
        this.sleepState = value;

        if (this.sleepState === Sleeping.SLEEPING) {
            this.sleepyTimer = Sleeping.sleepyTimeLimit;

            Vector.set(this.positionImpulse, 0, 0);
            Vector.set(this.velocity, 0, 0);

            this.angularVelocity = 0;

            this.motion = 0;

            if (this.sleepState !== prevState) {
                this.events.trigger('sleep-start');
            }
        } else if (this.sleepState === Sleeping.AWAKE) {
            this.sleepyTimer = 0;
            if (this.sleepState !== prevState) {
                this.events.trigger('sleep-end');
            }
        }

    }

    applyForce (force, offset = undefined) {
        Vector.add(this.force, force);
        if (offset) {
            this.torque += Vector.cross(offset, force);
        }
    }

    applyImpulse (impusle, offset = undefined, move = false) {
        const velocity = Vector.scale(impusle, this.inverseMass, Body.vecTemp[0]);
        Vector.add(this.velocity, velocity);

        if (move) {
            this.translate(velocity);
        }
        if (offset) {
            const angularVelocity = Vector.cross(offset, impusle) * this.inverseInertia;
            this.angularVelocity += angularVelocity;
            if (move) {
                this.angle += angularVelocity;
            }
        }
    }

    setVelocity (velocity) {
        Vector.clone(velocity, this.velocity);
    }

    setFixedRotation (value) {
        if (value) {
            this.inertia = 0;
            this.inverseInertia = 0;
        } else {
            this.updateInertia();
        }
    }
}

Body.vecTemp = [
    new Vector(),
];