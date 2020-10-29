import { Vector } from '../math/Vector';
import { Sleeping } from '../body/Sleeping';

export class Solver {

    constructor (engine) {
        this.engine = engine;
        this.positionIterations = 5;  
        this.velocityIterations = 5;
        this.constraintIterations = 5;
    }

    update () {

        const pairs = this.engine.narrowphase.activePairs;

        for (const pair of pairs) {
            if (pair.isSleeping) continue;
            for (const shapePair of pair.shapePairs.values()) {
                if (!shapePair.isActive) continue;
                shapePair.update();
            }
        }
        
        
        // solve position
        this.preSolvePosition();
        for (let i = 0; i < this.positionIterations; ++i) {
            this.solvePosition();
        }
        this.postSolvePosition();

        // solve constraints
        this.preSolveConstraints();
        for (let i = 0; i < this.constraintIterations; ++i) {
            this.solveConstraints();
        }

        // solve velocity
        this.preSolveVelocity();
        for (let i = 0; i < this.velocityIterations; ++i) {
            this.solveVelocity();
        }
        
    }

    preSolvePosition () {
        const pairs = this.engine.narrowphase.activePairs;
        const bodies = this.engine.world.allBodies();

        for (const body of bodies) {
            body.contactsCount = 0;
        }

        for (const pair of pairs) {
            pair.bodyA.contactsCount += pair.contacts.length;
            pair.bodyB.contactsCount += pair.contacts.length;
        }
    }

    solvePosition () {
        const pairs = this.engine.narrowphase.activePairs;

        for (const pair of pairs) {
            if (pair.isSleeping) continue;
            for (const shapePair of pair.shapePairs.values()) {
                if (!shapePair.isActive) continue;

                shapePair.separation = Vector.dot(
                    shapePair.normal,
                    Vector.subtract(shapePair.penetration, Vector.subtract(pair.bodyB.positionImpulse, pair.bodyA.positionImpulse, Vector.temp[0]), Vector.temp[1]),
                );
            }   
        }

        for (const pair of pairs) {
            if (pair.isSleeping) continue;

            for (const shapePair of pair.shapePairs.values()) {
                if (!shapePair.isActive) continue;

                const positionImpulse = (shapePair.separation - Solver.SLOP) * (pair.bodyA.isStatic || pair.bodyB.isStatic ? 1 : 0.5);
                
                if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) { 
                    const share = Solver.DEPTH_DAMPING / pair.bodyA.contactsCount;
                    pair.bodyA.positionImpulse.x -= shapePair.normal.x * positionImpulse * share;
                    pair.bodyA.positionImpulse.y -= shapePair.normal.y * positionImpulse * share;
                }
                
                if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                    const share = Solver.DEPTH_DAMPING / pair.bodyB.contactsCount;
                    pair.bodyB.positionImpulse.x += shapePair.normal.x * positionImpulse * share;
                    pair.bodyB.positionImpulse.y += shapePair.normal.y * positionImpulse * share;
                }
            }
        }
    }

    postSolvePosition () {
        const bodies = this.engine.world.allBodies();

        for (const body of bodies) {
            if (body.isStatic || body.sleepState === Sleeping.SLEEPING) continue;

            Vector.add(body.position, body.positionImpulse);

            if (Vector.dot(body.positionImpulse, body.velocity) > 0) {
                Vector.set(body.positionImpulse, 0, 0);
            } else {
                Vector.scale(body.positionImpulse, Solver.POSITION_IMPULSE_DAMPING);
            }
        }
    }

    preSolveVelocity () {
        const pairs = this.engine.narrowphase.activePairs;

        for (const pair of pairs) {

            if (pair.isSleeping) continue;

            for (const shapePair of pair.shapePairs.values()) {
                if (!shapePair.isActive) continue;

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    const contact = shapePair.contacts[i];

                    const impulse = Vector.scale(shapePair.normal, contact.normalImpulse, Vector.temp[0]);

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        const offset = Vector.subtract(contact.vertex, pair.bodyA.position, Vector.temp[2]);
                        pair.bodyA.applyImpulse(Vector.neg(impulse, Vector.temp[3]), offset, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        const offset = Vector.subtract(contact.vertex, pair.bodyB.position, Vector.temp[2]);
                        pair.bodyB.applyImpulse(impulse, offset, false);
                    }        
                }
            }
        }
    }

    solveVelocity () {
        const pairs = this.engine.narrowphase.activePairs;

        for (const pair of pairs) {

            if (pair.isSleeping) continue;

            const contactShare = 1 / pair.contacts.length;

            const velocityA = Vector.clone(pair.bodyA.velocity);
            const angularVelocityA = pair.bodyA.angularVelocity;
            const velocityB = Vector.clone(pair.bodyB.velocity);
            const angularVelocityB = pair.bodyB.angularVelocity;

            for (const shapePair of pair.shapePairs.values()) {
                if (!shapePair.isActive) continue;

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    const contact = shapePair.contacts[i];

                    const offsetA = Vector.subtract(contact.vertex, pair.bodyA.position, Vector.temp[0]);
                    const offsetB = Vector.subtract(contact.vertex, pair.bodyB.position, Vector.temp[1]);

                    const contactVelocityA = Vector.add(velocityA, Vector.scale(Vector.rotate90(offsetA, Vector.temp[2]), angularVelocityA), Vector.temp[2]);
                    const contactVelocityB = Vector.add(velocityB, Vector.scale(Vector.rotate90(offsetB, Vector.temp[3]), angularVelocityB), Vector.temp[3]);
                    
                    const relativeVelocity = Vector.subtract(contactVelocityA, contactVelocityB, Vector.temp[4]);
                    
                    const crossA = Vector.cross(offsetA, shapePair.normal);
                    const crossB = Vector.cross(offsetB, shapePair.normal);
                    const share = contactShare / (
                        pair.bodyA.inverseMass +
                        pair.bodyB.inverseMass +
                        pair.bodyA.inverseInertia * Math.pow(crossA, 2) +
                        pair.bodyB.inverseInertia * Math.pow(crossB, 2)
                    );

                    const normalVelocity = Vector.dot(relativeVelocity, shapePair.normal);
                    let normalImpulse = (1 + shapePair.restitution) * normalVelocity * share;

                    if (normalVelocity > Solver.RESTING_THRESHOLD) {
                        contact.normalImpulse = 0;
                    } else {
                        const contactNormalImpulse = contact.normalImpulse;
                        contact.normalImpulse = Math.max(contact.normalImpulse + normalImpulse, 0);
                        normalImpulse = contact.normalImpulse - contactNormalImpulse;
                    }

                    const tangentVelocity = Vector.dot(relativeVelocity, shapePair.tangent);
                    let tangentImpulse = tangentVelocity * share;

                    if (Math.abs(tangentVelocity) > -shapePair.frictionStatic * normalVelocity) {
                        tangentImpulse *= shapePair.friction;
                    }

                    const impulse = Vector.add(
                        Vector.scale(shapePair.normal, normalImpulse, Vector.temp[5]),
                        Vector.scale(shapePair.tangent, tangentImpulse, Vector.temp[6]),
                    );
                    
                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyA.applyImpulse(Vector.neg(impulse, Vector.temp[6]), offsetA, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, offsetB, false);
                    }
                }
            }
        }
    }

    preSolveConstraints () {
        const bodies = this.engine.world.allBodies();

        for (const body of bodies) {
            if (body.isStatic || body.sleepState === Sleeping.SLEEPING) continue;
            body.constraintImpulse.x *= Solver.CONSTRAINT_IMPULSE_DAMPING;
            body.constraintImpulse.y *= Solver.CONSTRAINT_IMPULSE_DAMPING;
            body.constraintImpulse.angle *= Solver.CONSTRAINT_IMPULSE_DAMPING;

            body.position.x += body.constraintImpulse.x;
            body.position.y += body.constraintImpulse.y;
            body.angle += body.constraintImpulse.angle;

            body.velocity.x += body.constraintImpulse.x;
            body.velocity.y += body.constraintImpulse.y;
            body.angularVelocity += body.constraintImpulse.angle;
        }
    }

    solveConstraints () {
        const constraints = this.engine.world.allConstraints();

        for (const constraint of constraints) {
            constraint.solve();
        }
        
    }
}

Solver.SLOP = 0.005;
Solver.DEPTH_DAMPING = 0.8;
Solver.POSITION_IMPULSE_DAMPING = 0.8;
Solver.CONSTRAINT_IMPULSE_DAMPING = 0.4;
Solver.RESTING_THRESHOLD = 0.08;