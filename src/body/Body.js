import { Vector } from '../math/Vector';
import { Bounds } from '../math/Bounds';
import { Common } from '../common/Common';
import { Events } from '../common/Events';
import { Sleeping } from './Sleeping';


export class Body {

    constructor (options = {}) {
        this.id = Common.nextId();
        this.name = 'body';
        this.shapes = [];
        this.shapesBounds = [];
        this.bounds = new Bounds();
        this.boundsNeedsUpdate = true;
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
        this.isStatic = false;
        this.velocityDamping = 0.0005;
        this.density = 100;
        this.mass = 0;
        this.inverseMass = 0;
        this.inertia = 0;
        this.inverseInertia = 0;
        this.area = 0;
        this.sleepState = Sleeping.AWAKE;
        this.motion = 0;
        this.sleepyTimer = 0;

        this.set(options);
        
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
            }
        }

    }

    update (delta) {
        if (this.isStatic || this.sleepState === Sleeping.SLEEPING) return;

        // update acceleration
        Vector.scale(this.force, this.inverseMass * delta, this.acceleration);

        // update velocity
        Vector.add(Vector.scale(this.velocity, (1 - this.velocityDamping)), Vector.scale(this.acceleration, delta));
        
        // update position 
        Vector.clone(this.position, this.positionPrev);
        Vector.add(this.position, this.velocity, this.position);
        
        // update angularAcceleration
        this.angularAcceleration = this.torque * this.inverseInertia * delta;

        // update angularVelocity
        this.angularVelocity = this.angularVelocity * (1 - this.velocityDamping) + this.angularAcceleration * delta;

        // update angle
        this.anglePrev = this.angle;
        this.angle += this.angularVelocity;

        // clear forces
        Vector.set(this.force, 0, 0);
        this.torque = 0;

        this.boundsNeedsUpdate = true;
    }

    addShape (shape, updateCenterOfMass = false, offset = new Vector(), angle = 0) {

        Vector.add(shape.position, offset);
        shape.angle += angle;
        shape.body = this;

        this.shapes.push(shape);

        this.updateArea();

        if (updateCenterOfMass) {
            this.updateCenterOfMass();
        }

        this.updateMass();
        this.updateInertia();
        
        this.boundsNeedsUpdate = true;

        this.events.trigger('addShape', [{shape, updateCenterOfMass, offset, angle, body: this}])
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
            for(const shape of this.shapes) {
                // now this code is wrong
                const r = Vector.length(shape.position);
                const shapeInertia = shape.inertia;
                inertia += shapeInertia + r;
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
            this.inverseMass = this.mass === 0 ? 0 : 1 / this.mass;
        }

    }

    updateBounds () {
        if (this.boundsNeedsUpdate) {
            this.shapesBounds.length = 0;

            for (const shape of this.shapes) {
                this.shapesBounds.push(shape.updateBounds());
            }
            Bounds.combine(this.shapesBounds, this.bounds);
            this.boundsNeedsUpdate = false;
        }
    }

    updateCenterOfMass () {
        const sum = Vector.temp[0];
        Vector.set(sum, 0, 0);
    
        for (const shape of this.shapes){
            Vector.add(sum, Vector.scale(shape.position, shape.area, Vector.temp[1]));
        }
    
        const cm = Vector.scale(sum, 1 / this.area, Vector.temp[1]);
        
        for(const shape of this.shapes){
            Vector.subtract(shape.position, cm);
        }
        
        this.setPosition(Vector.add(this.position, cm, Vector.temp[2]));
    }

    setPosition (position) {
        Vector.clone(position, this.position);
        this.boundsNeedsUpdate = true;
    }

    translate (offset) {
        Vector.add(this.position, offset);
        this.boundsNeedsUpdate = true;
    }

    setAngle (angle) {
        this.angle = angle;
        this.boundsNeedsUpdate = true;
    }

    rotate (angle) {
        this.angle += angle;
        this.boundsNeedsUpdate = true;
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

    getBounds () {
        this.updateBounds();
        return this.bounds;
    }

    setStatic (value) {
        this.isStatic = value;
        if (value) {
            Vector.set(this.acceleration, 0, 0);
            Vector.set(this.velocity, 0, 0);
            Vector.set(this.force, 0, 0);
            this.angularAcceleration = 0;
            this.angularVelocity = 0;
            this.torque = 0;
            Vector.set(this.positionImpulse, 0, 0);
        }
        this.updateMass();
        this.updateInertia();
    }

    setSleeping (value) {
        this.sleepState = value;

        if (this.sleepState === Sleeping.SLEEPING) {
            this.sleepyTimer = Sleeping.sleepyTimeLimit;

            Vector.set(this.positionImpulse, 0, 0);
            Vector.set(this.velocity, 0, 0);

            this.angularVelocity = 0;

            this.motion = 0;
        } else if (this.sleepState === Sleeping.AWAKE) {
            this.sleepyTimer = 0;
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
            Vector.add(this.position, velocity);
        }
        if (offset) {
            const angularVelocity = Vector.cross(offset, impusle) * this.inverseMass;
            this.angularVelocity += angularVelocity;
            if (move) {
                this.angle += angularVelocity;
            }
        }
    }

    setVelocity (velocity) {
        Vector.clone(velocity, this.velocity);
    }

}

Body.vecTemp = [
    new Vector(),
];