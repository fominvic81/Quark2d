import { Vector } from '../../math/Vector';
import { SleepingState } from '../../body/Sleeping';
import { Common } from '../../common/Common';
import { Contact } from '../pair/Contact';
import { Pair } from '../pair/Pair';
import { Engine } from '../../engine/Engine';

/**
 * The 'Solver' is a class for solving collisions.
 */

export class Solver {
    engine: Engine;
    positionIterations: number = 5;
    velocityIterations: number = 5;
    constraintIterations: number = 5;

    static SLOP: number = 0.005;
    static DEPTH_DAMPING: number = 0.8;
    static POSITION_IMPULSE_DAMPING: number = 0.4;
    static CONSTRAINT_IMPULSE_DAMPING: number = 0.4;
    static RESTING_THRESHOLD: number = 0.08;

    private static vecTemp = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
    ];

    constructor (engine: Engine) {
        this.engine = engine;
    }

    /**
     * Solves the collisions.
     */
    update () {
        const pairs: Array<Pair> = this.engine.manager.activePairs;

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

    /**
     * Prepares the pairs for solving;
     */
    preSolvePosition () {
        const pairs: Array<Pair> = this.engine.manager.activePairs;

        for (const body of this.engine.world.bodies.values()) {
            body.contactsCount = 0;
        }

        for (const pair of pairs) {
            pair.bodyA.contactsCount += pair.contactsCount;
            pair.bodyB.contactsCount += pair.contactsCount;
        }
    }

    /**
     * Solves position correction.
     */
    solvePosition () {
        const pairs: Array<Pair> = this.engine.manager.activePairs;

        let positionImpulse: number;

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
                
                if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === SleepingState.SLEEPING)) { 
                    const share = Solver.DEPTH_DAMPING / pair.bodyA.contactsCount;
                    pair.bodyA.positionImpulse.x -= shapePair.normal.x * positionImpulse * share;
                    pair.bodyA.positionImpulse.y -= shapePair.normal.y * positionImpulse * share;
                }
                
                if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === SleepingState.SLEEPING)) {
                    const share = Solver.DEPTH_DAMPING / pair.bodyB.contactsCount;
                    pair.bodyB.positionImpulse.x += shapePair.normal.x * positionImpulse * share;
                    pair.bodyB.positionImpulse.y += shapePair.normal.y * positionImpulse * share;
                }
            }
        }
    }

    /**
     * Moves the bodies by solved position correction.
     */
    postSolvePosition () {

        for (const body of this.engine.world.activeBodies.values()) {

            body.translate(body.positionImpulse);

            if (Vector.dot(body.positionImpulse, body.velocity) > 0) {
                body.positionImpulse.set(0, 0);
            } else {
                body.positionImpulse.scale(Solver.POSITION_IMPULSE_DAMPING);
            }
        }
    }

    /**
     * Solves warm starting.
     */
    preSolveVelocity () {
        const pairs: Array<Pair> = this.engine.manager.activePairs;

        const impulse: Vector = Solver.vecTemp[0];
        const temp: Vector = Solver.vecTemp[1];

        for (const pair of pairs) {

            if (pair.isSleeping) continue;

            for (const shapePair of pair.activeShapePairs) {

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    const contact = shapePair.contacts[i];

                    shapePair.normal.scale(contact.normalImpulse, impulse);
                    Vector.add(impulse, shapePair.tangent.scale(contact.tangentImpulse, temp));

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === SleepingState.SLEEPING)) {
                        pair.bodyA.applyImpulse(impulse.neg(temp), contact.offsetA);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === SleepingState.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, contact.offsetB);
                    }
                }
            }
        }
    }

    /**
     * Solves velocity
     */
    solveVelocity () {
        const pairs: Array<Pair> = this.engine.manager.activePairs;

        const contactVelocityA: Vector = Solver.vecTemp[0];
        const contactVelocityB: Vector = Solver.vecTemp[1];
        const relativeVelocity: Vector = Solver.vecTemp[2];
        const impulse: Vector = Solver.vecTemp[3];
        const velocityA: Vector = Solver.vecTemp[4];
        const velocityB: Vector = Solver.vecTemp[5];
        const temp: Vector = Solver.vecTemp[6];

        let contact: Contact,
            normalVelocity: number,
            normalImpulse: number,
            tangentVelocity: number,
            tangentImpulse: number,
            angularVelocityA: number,
            angularVelocityB: number;

        for (const pair of pairs) {
            if (pair.isSleeping) continue;

            for (const shapePair of pair.activeShapePairs) {

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    contact = shapePair.contacts[i];

                    Vector.add(pair.bodyA.velocity, contact.offsetA.rotate90(contactVelocityA).scale(pair.bodyA.angularVelocity), contactVelocityA);
                    Vector.add(pair.bodyB.velocity, contact.offsetB.rotate90(contactVelocityB).scale(pair.bodyB.angularVelocity), contactVelocityB);

                    Vector.subtract(contactVelocityA, contactVelocityB, relativeVelocity);

                    tangentVelocity = Vector.dot(shapePair.tangent, relativeVelocity) + shapePair.surfaceVelocity;
                    tangentImpulse = tangentVelocity * contact.tangentShare;

                    const maxFriction = shapePair.friction * contact.normalImpulse;

                    const newImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                    tangentImpulse = newImpulse - contact.tangentImpulse;
                    contact.tangentImpulse = newImpulse;

                    shapePair.tangent.scale(tangentImpulse, impulse);

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === SleepingState.SLEEPING)) {
                        pair.bodyA.applyImpulse(impulse.neg(temp), contact.offsetA);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === SleepingState.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, contact.offsetB);
                    }
                }

                pair.bodyA.velocity.clone(velocityA);
                angularVelocityA = pair.bodyA.angularVelocity;
                pair.bodyB.velocity.clone(velocityB);
                angularVelocityB = pair.bodyB.angularVelocity;

                for (let i = 0; i < shapePair.contactsCount; ++i) {
                    contact = shapePair.contacts[i];

                    Vector.add(velocityA, contact.offsetA.rotate90(contactVelocityA).scale(angularVelocityA), contactVelocityA);
                    Vector.add(velocityB, contact.offsetB.rotate90(contactVelocityB).scale(angularVelocityB), contactVelocityB);

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

                    shapePair.normal.scale(normalImpulse, impulse);

                    if (!(pair.bodyA.isStatic || pair.bodyA.sleepState === SleepingState.SLEEPING)) {
                        pair.bodyA.applyImpulse(impulse.neg(temp), contact.offsetA);
                    }
                    if (!(pair.bodyB.isStatic || pair.bodyB.sleepState === SleepingState.SLEEPING)) {
                        pair.bodyB.applyImpulse(impulse, contact.offsetB);
                    }
                }
            }
        }
    }

    preSolveConstraints () {

        for (const body of this.engine.world.activeBodies.values()) {

            body.dir.clone(body.constraintDir);
            body.constraintAngle = body.angle;

            body.constraintImpulse.x *= Solver.CONSTRAINT_IMPULSE_DAMPING;
            body.constraintImpulse.y *= Solver.CONSTRAINT_IMPULSE_DAMPING;
            body.constraintAngleImpulse *= Solver.CONSTRAINT_IMPULSE_DAMPING;

            body.translate(body.constraintImpulse);
            body.constraintAngle += body.constraintAngleImpulse;
            body.constraintDir.rotate(body.constraintAngleImpulse);

            body.velocity.x += body.constraintImpulse.x;
            body.velocity.y += body.constraintImpulse.y;
            body.angularVelocity += body.constraintAngleImpulse;
        }
    }

    /**
     * Solves constraint.
     */
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