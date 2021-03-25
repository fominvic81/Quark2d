import { Vector } from '../../math/Vector';
import { Sleeping } from '../../body/Sleeping';
import { Common } from '../../common/Common';

export class Solver {

    constructor (engine) {
        this.engine = engine;
        this.positionIterations = 5;  
        this.velocityIterations = 5;
        this.constraintIterations = 5;
    }

    update () {

        const pairs = this.engine.manager.activePairs;

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
        const pairs = this.engine.manager.activePairs;

        for (const body of this.engine.world.bodies.values()) {
            body.contactsCount = 0;
        }

        for (const pair of pairs) {
            pair.bodyA.contactsCount += pair.contactsCount;
            pair.bodyB.contactsCount += pair.contactsCount;
        }
    }

    solvePosition () {
        const pairs = this.engine.manager.activePairs;

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

                positionImpulse = (shapePair.separation - Solver.SLOP);

                if (pair.bodyA.isStatic || pair.bodyB.isStatic) {
                    positionImpulse *= 2;
                }
                
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
        const pairs = this.engine.manager.activePairs;

        const impulse = Solver.vecTemp[0];
        const temp = Solver.vecTemp[1];

        for (const pair of pairs) {

            if (pair.isSleeping) continue;

            for (const shapePair of pair.activeShapePairs) {

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    const contact = shapePair.contacts[i];

                    Vector.scale(shapePair.normal, contact.normalImpulse, impulse);
                    Vector.add(impulse, Vector.scale(shapePair.tangent, contact.tangentImpulse, temp));

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyA.applyImpulse(Vector.neg(impulse, temp), contact.offsetA, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, contact.offsetB, false);
                    }        
                }
            }
        }
    }

    solveVelocity () {
        const pairs = this.engine.manager.activePairs;

        const contactVelocityA = Solver.vecTemp[0];
        const contactVelocityB = Solver.vecTemp[1];
        const relativeVelocity = Solver.vecTemp[2];
        const impulse = Solver.vecTemp[3];
        const velocityA = Solver.vecTemp[4];
        const velocityB = Solver.vecTemp[5];
        const temp = Solver.vecTemp[6];

        let contact,
            normalVelocity,
            normalImpulse,
            tangentVelocity,
            tangentImpulse,
            angularVelocityA,
            angularVelocityB;

        for (const pair of pairs) {
            if (pair.isSleeping) continue;

            for (const shapePair of pair.activeShapePairs) {

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    contact = shapePair.contacts[i];

                    Vector.add(pair.bodyA.velocity, Vector.scale(Vector.rotate90(contact.offsetA, contactVelocityA), pair.bodyA.angularVelocity), contactVelocityA);
                    Vector.add(pair.bodyB.velocity, Vector.scale(Vector.rotate90(contact.offsetB, contactVelocityB), pair.bodyB.angularVelocity), contactVelocityB);

                    Vector.subtract(contactVelocityA, contactVelocityB, relativeVelocity);

                    tangentVelocity = Vector.dot(shapePair.tangent, relativeVelocity) + shapePair.surfaceVelocity;
                    tangentImpulse = tangentVelocity * contact.tangentShare;

                    const maxFriction = shapePair.friction * contact.normalImpulse;

                    const newImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                    tangentImpulse = newImpulse - contact.tangentImpulse;
                    contact.tangentImpulse = newImpulse;

                    Vector.scale(shapePair.tangent, tangentImpulse, impulse);

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyA.applyImpulse(Vector.neg(impulse, temp), contact.offsetA, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, contact.offsetB, false);
                    }
                }

                Vector.clone(pair.bodyA.velocity, velocityA);
                angularVelocityA = pair.bodyA.angularVelocity;
                Vector.clone(pair.bodyB.velocity, velocityB);
                angularVelocityB = pair.bodyB.angularVelocity;

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    contact = shapePair.contacts[i];

                    Vector.add(velocityA, Vector.scale(Vector.rotate90(contact.offsetA, contactVelocityA), angularVelocityA), contactVelocityA);
                    Vector.add(velocityB, Vector.scale(Vector.rotate90(contact.offsetB, contactVelocityB), angularVelocityB), contactVelocityB);

                    Vector.subtract(contactVelocityA, contactVelocityB, relativeVelocity);

                    normalVelocity = Vector.dot(relativeVelocity, shapePair.normal);
                    normalImpulse = (normalVelocity) * (1 + shapePair.restitution) * contact.normalShare;

                    if (normalVelocity > Solver.RESTING_THRESHOLD) {
                        contact.normalImpulse = 0;
                    } else {
                        const newImpulse = Math.max(contact.normalImpulse + normalImpulse, 0);
                        normalImpulse = newImpulse - contact.normalImpulse;
                        contact.normalImpulse = newImpulse;
                    }

                    Vector.scale(shapePair.normal, normalImpulse, impulse);

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyA.applyImpulse(Vector.neg(impulse, temp), contact.offsetA, false);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === Sleeping.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, contact.offsetB, false);
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
Solver.POSITION_IMPULSE_DAMPING = 0.4;
Solver.CONSTRAINT_IMPULSE_DAMPING = 0.4;
Solver.RESTING_THRESHOLD = 0.08;

Solver.vecTemp = [
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
];