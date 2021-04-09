import { Vector } from '../../math/Vector';
import { SleepingState } from '../../body/Sleeping';
import { Common } from '../../common/Common';
import { Contact } from '../pair/Contact';
import { Engine } from '../../engine/Engine';
import { Pair } from '../pair/Pair';
import { Body, BodyType } from '../../body/Body';

/**
 * The 'Solver' is a class for solving collisions.
 */

export class Solver {
    engine: Engine;
    positionIterations: number = 5;
    velocityIterations: number = 5;
    constraintIterations: number = 5;

    static SLOP: number = 0.005;
    static DEPTH_DAMPING: number = 0.7;
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
        for (const pair of this.engine.manager.pairsToSolve) {
            pair.update();
        }

        this.preSolve();

        // solve position
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
        this.warmStart();
        for (let i = 0; i < this.velocityIterations; ++i) {
            this.solveVelocity();
        }
    }

    /**
     * Prepares the pairs for solving;
     */
    preSolve () {
        for (const body of this.engine.world.bodies.values()) {
            body.pairsCount = 0;
        }

        for (const pair of this.engine.manager.activePairs) {
            ++(<Body>pair.shapeA.body).pairsCount;
            ++(<Body>pair.shapeB.body).pairsCount;
        }
    }

    /**
     * Solves position correction.
     */
    solvePosition () {
        const pairs: Pair[] = this.engine.manager.pairsToSolve;

        let positionImpulse: number;

        for (const pair of pairs) {
            pair.separation = Vector.dot(
                pair.normal,
                Vector.subtract(pair.penetration, Vector.subtract((<Body>pair.shapeB.body).positionImpulse, (<Body>pair.shapeA.body).positionImpulse, Solver.vecTemp[0]), Solver.vecTemp[1]),
            );
        }

        for (const pair of pairs) {
            const bodyA = <Body>pair.shapeA.body;
            const bodyB = <Body>pair.shapeB.body;

            positionImpulse = pair.separation - Solver.SLOP;

            if (bodyA.type !== BodyType.dynamic || bodyB.type !== BodyType.dynamic) {
                positionImpulse *= 2;
            }

            if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) { 
                const share = Solver.DEPTH_DAMPING / bodyA.pairsCount;
                bodyA.positionImpulse.x -= pair.normal.x * positionImpulse * share;
                bodyA.positionImpulse.y -= pair.normal.y * positionImpulse * share;
            }

            if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                const share = Solver.DEPTH_DAMPING / bodyB.pairsCount;
                bodyB.positionImpulse.x += pair.normal.x * positionImpulse * share;
                bodyB.positionImpulse.y += pair.normal.y * positionImpulse * share;
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
    warmStart () {
        const contacts = this.engine.manager.contacts;

        const impulse: Vector = Solver.vecTemp[0];
        const temp: Vector = Solver.vecTemp[1];

        for (const contact of contacts) {
            const bodyA = <Body>contact.pair.shapeA.body;
            const bodyB = <Body>contact.pair.shapeB.body;

            contact.pair.normal.scale(contact.normalImpulse, impulse);
            impulse.add(contact.pair.tangent.scale(contact.tangentImpulse, temp));

            if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                bodyA.applyImpulse(impulse.neg(temp), contact.offsetA);
            }
            if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                bodyB.applyImpulse(impulse, contact.offsetB);
            }
        }
    }

    /**
     * Solves velocity
     */
    solveVelocity () {
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

        for (const pair of this.engine.manager.pairsToSolve) {
            const bodyA = <Body>pair.shapeA.body;
            const bodyB = <Body>pair.shapeB.body;
            for (let i = 0; i < pair.contactsCount; ++i) {
                contact = pair.contacts[i];

                Vector.add(bodyA.velocity, contact.offsetA.rotate90(contactVelocityA).scale(bodyA.angularVelocity), contactVelocityA);
                Vector.add(bodyB.velocity, contact.offsetB.rotate90(contactVelocityB).scale(bodyB.angularVelocity), contactVelocityB);

                Vector.subtract(contactVelocityA, contactVelocityB, relativeVelocity);

                tangentVelocity = Vector.dot(pair.tangent, relativeVelocity) + pair.surfaceVelocity;
                tangentImpulse = tangentVelocity * contact.tangentShare;

                const maxFriction = pair.friction * contact.normalImpulse;

                const newImpulse = Common.clamp(contact.tangentImpulse + tangentImpulse, -maxFriction, maxFriction);
                tangentImpulse = newImpulse - contact.tangentImpulse;
                contact.tangentImpulse = newImpulse;

                pair.tangent.scale(tangentImpulse, impulse);

                if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                    bodyA.applyImpulse(impulse.neg(temp), contact.offsetA);
                }
                if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                    bodyB.applyImpulse(impulse, contact.offsetB);
                }
            }

            bodyA.velocity.clone(velocityA);
            angularVelocityA = bodyA.angularVelocity;
            bodyB.velocity.clone(velocityB);
            angularVelocityB = bodyB.angularVelocity;
            for (let i = 0; i < pair.contactsCount; ++i) {
                contact = pair.contacts[i];

                Vector.add(velocityA, contact.offsetA.rotate90(contactVelocityA).scale(angularVelocityA), contactVelocityA);
                Vector.add(velocityB, contact.offsetB.rotate90(contactVelocityB).scale(angularVelocityB), contactVelocityB);

                Vector.subtract(contactVelocityA, contactVelocityB, relativeVelocity);

                normalVelocity = Vector.dot(relativeVelocity, pair.normal);
                normalImpulse = (normalVelocity) * (1 + pair.restitution) * contact.normalShare;

                if (normalVelocity > Solver.RESTING_THRESHOLD) {
                    contact.normalImpulse = 0;
                } else {
                    const newImpulse = Math.max(contact.normalImpulse + normalImpulse, 0);
                    normalImpulse = newImpulse - contact.normalImpulse;
                    contact.normalImpulse = newImpulse;
                }

                pair.normal.scale(normalImpulse, impulse);

                if (bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
                    bodyA.applyImpulse(impulse.neg(temp), contact.offsetA);
                }
                if (bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
                    bodyB.applyImpulse(impulse, contact.offsetB);
                }
            }
        }
    }

    preSolveConstraints () {

        for (const body of this.engine.world.bodies.values()) {
            body.dir.clone(body.constraintDir);
            body.constraintAngle = body.angle;
        }

        for (const body of this.engine.world.activeBodies.values()) {

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