import { Vector } from '../../math/Vector';
import { Sleeping } from '../../body/Sleeping';

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
            for (const shapePair of pair.activeShapePairs) {
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
        this.postSolveConstraints();

        // solve velocity
        this.preSolveVelocity();
        for (let i = 0; i < this.velocityIterations; ++i) {
            this.solveVelocity();
        }
        
    }

    preSolvePosition () {
        const pairs = this.engine.narrowphase.activePairs;

        for (const body of this.engine.world.bodies.values()) {
            body.contactsCount = 0;
        }

        for (const pair of pairs) {
            pair.bodyA.contactsCount += pair.contacts.length;
            pair.bodyB.contactsCount += pair.contacts.length;
        }
    }

    solvePosition () {
        const pairs = this.engine.narrowphase.activePairs;

        let positionImpulse;

        for (const pair of pairs) {
            if (pair.isSleeping) continue;
            for (const shapePair of pair.activeShapePairs) {

                shapePair.separation = Vector.dot(
                    shapePair.normal,
                    Vector.subtract(shapePair.penetration, Vector.subtract(pair.bodyB.positionImpulse, pair.bodyA.positionImpulse, Solver.vecTemp[0]), Solver.vecTemp[1]),
                );
            }   
        }

        for (const pair of pairs) {
            if (pair.isSleeping) continue;

            for (const shapePair of pair.activeShapePairs) {

                positionImpulse = (shapePair.separation - Solver.SLOP) * (pair.bodyA.isStatic || pair.bodyB.isStatic ? 1 : 0.5);
                
                if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) { 
                    const share = Solver.DEPTH_DAMPING / pair.bodyA.contactsCount;
                    if (pair.bodyA.inverseMassMultiplier.x !== 0) {
                        pair.bodyA.positionImpulse.x -= shapePair.normal.x * positionImpulse * share;
                    }
                    if (pair.bodyA.inverseMassMultiplier.y !== 0) {
                        pair.bodyA.positionImpulse.y -= shapePair.normal.y * positionImpulse * share;
                    }
                }
                
                if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                    const share = Solver.DEPTH_DAMPING / pair.bodyB.contactsCount;
                    if (pair.bodyB.inverseMassMultiplier.x !== 0) {
                        pair.bodyB.positionImpulse.x += shapePair.normal.x * positionImpulse * share;
                    }
                    if (pair.bodyB.inverseMassMultiplier.y !== 0) {
                        pair.bodyB.positionImpulse.y += shapePair.normal.y * positionImpulse * share;
                    }
                }
            }
        }
    }

    postSolvePosition () {

        for (const body of this.engine.world.activeBodies.values()) {

            body.translate(body.positionImpulse);

            if (Vector.dot(body.positionImpulse, body.velocity) > 0) {
                Vector.set(body.positionImpulse, 0, 0);
            } else {
                Vector.scale(body.positionImpulse, Solver.POSITION_IMPULSE_DAMPING);
            }
        }
    }

    preSolveVelocity () {
        const pairs = this.engine.narrowphase.activePairs;

        const impulse = Solver.vecTemp[0];
        const offset = Solver.vecTemp[2];
        const temp3 = Solver.vecTemp[3];

        for (const pair of pairs) {

            if (pair.isSleeping) continue;

            for (const shapePair of pair.activeShapePairs) {

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    const contact = shapePair.contacts[i];

                    Vector.scale(shapePair.normal, contact.normalImpulse, impulse);

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        Vector.subtract(contact.vertex, pair.bodyA.position, offset);
                        pair.bodyA.applyImpulse(Vector.neg(impulse, temp3), offset, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        Vector.subtract(contact.vertex, pair.bodyB.position, offset);
                        pair.bodyB.applyImpulse(impulse, offset, false);
                    }        
                }
            }
        }
    }

    solveVelocity () {
        const pairs = this.engine.narrowphase.activePairs;

        const offsetA = Solver.vecTemp[0];
        const offsetB = Solver.vecTemp[1];
        const contactVelocityA = Solver.vecTemp[2];
        const contactVelocityB = Solver.vecTemp[3];
        const relativeVelocity = Solver.vecTemp[4];
        const impulse = Solver.vecTemp[5];
        const velocityA = Solver.vecTemp[6];
        const velocityB = Solver.vecTemp[7];

        let contact,
            crossA,
            crossB,
            share,
            normalVelocity,
            normalImpulse,
            tangentVelocity,
            tangentImpulse,
            angularVelocityA,
            angularVelocityB;

        for (const pair of pairs) {

            if (pair.isSleeping) continue;

            const contactShare = 1 / pair.contacts.length;

            Vector.clone(pair.bodyA.velocity, velocityA);
            angularVelocityA = pair.bodyA.angularVelocity;
            Vector.clone(pair.bodyB.velocity, velocityB);
            angularVelocityB = pair.bodyB.angularVelocity;

            for (const shapePair of pair.activeShapePairs) {

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    contact = shapePair.contacts[i];

                    Vector.subtract(contact.vertex, pair.bodyA.position, offsetA);
                    Vector.subtract(contact.vertex, pair.bodyB.position, offsetB);

                    Vector.add(velocityA, Vector.scale(Vector.rotate90(offsetA, contactVelocityA), angularVelocityA), contactVelocityA);
                    Vector.add(velocityB, Vector.scale(Vector.rotate90(offsetB, contactVelocityB), angularVelocityB), contactVelocityB);
                    
                    Vector.subtract(contactVelocityA, contactVelocityB, relativeVelocity);
                    
                    crossA = Vector.cross(offsetA, shapePair.normal);
                    crossB = Vector.cross(offsetB, shapePair.normal);
                    share = contactShare / (
                        pair.bodyA.inverseMass +
                        pair.bodyB.inverseMass +
                        pair.bodyA.inverseInertiaMultiplied * Math.pow(crossA, 2) +
                        pair.bodyB.inverseInertiaMultiplied * Math.pow(crossB, 2)
                    );

                    normalVelocity = Vector.dot(relativeVelocity, shapePair.normal);
                    normalImpulse = (1 + shapePair.restitution) * normalVelocity * share;

                    if (normalVelocity > Solver.RESTING_THRESHOLD) {
                        contact.normalImpulse = 0;
                    } else {
                        const contactNormalImpulse = contact.normalImpulse;
                        contact.normalImpulse = Math.max(contact.normalImpulse + normalImpulse, 0);
                        normalImpulse = contact.normalImpulse - contactNormalImpulse;
                    }

                    tangentVelocity = Vector.dot(relativeVelocity, shapePair.tangent) + shapePair.surfaceVelocity;
                    tangentImpulse = tangentVelocity * share;

                    if (Math.abs(tangentVelocity) > -shapePair.frictionStatic * normalVelocity) {
                        tangentImpulse *= shapePair.friction;
                    }

                    Vector.add(
                        Vector.scale(shapePair.normal, normalImpulse, Vector.temp[0]),
                        Vector.scale(shapePair.tangent, tangentImpulse, Vector.temp[1]),
                        impulse,
                    );
                    
                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyA.applyImpulse(Vector.neg(impulse, Vector.temp[0]), offsetA, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, offsetB, false);
                    }
                }
            }
        }
    }

    preSolveConstraints () {

        for (const body of this.engine.world.activeBodies.values()) {

            Vector.clone(body.dir, body.constraintDir);
            body.constraintAngle = body.angle;

            body.constraintImpulse.x *= Solver.CONSTRAINT_IMPULSE_DAMPING;
            body.constraintImpulse.y *= Solver.CONSTRAINT_IMPULSE_DAMPING;
            body.constraintImpulse.angle *= Solver.CONSTRAINT_IMPULSE_DAMPING;

            body.translate(body.constraintImpulse);
            body.constraintAngle += body.constraintImpulse.angle;
            Vector.rotate(body.constraintDir, body.constraintImpulse.angle);

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

    postSolveConstraints () {

        for (const body of this.engine.world.activeBodies.values()) {
            body.setAngle(body.constraintAngle);
        }
    }
}

Solver.SLOP = 0.005;
Solver.DEPTH_DAMPING = 0.8;
Solver.POSITION_IMPULSE_DAMPING = 0.8;
Solver.CONSTRAINT_IMPULSE_DAMPING = 0.4;
Solver.RESTING_THRESHOLD = 0.08;

Solver.vecTemp = [
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
];