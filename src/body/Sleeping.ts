import { Engine } from '../engine/Engine';
import { Body, BodyType } from './Body';

export enum SleepingState {
    AWAKE,
    SLEEPY,
    SLEEPING,
}

export enum SleepingType {
    NO_SLEEPING,
    BODY_SLEEPING,
    ISLAND_SLEEPING,
}

interface SleepingOptions {
    type?: SleepingType;
}

/**
 * The 'Sleeping is a class for manage the sleeping of bodies.
 */

export class Sleeping {
    engine: Engine;
    type: number;

    static MOTION_SLEEP_LIMIT = 0.000018;
    static COLLISION_MOTION_SLEEP_LIMIT = 0.00004;
    static SLEEPY_TIME_LIMIT = 1;

    /**
     * @param engine
     * @param options
     */
    constructor (engine: Engine, options: SleepingOptions = {}) {

        this.engine = engine;
        this.type = options.type !== undefined ? options.type : SleepingType.BODY_SLEEPING;

    }

    /**
     * Sets the sleeping type to the given.
     * @param type 
     */
    setType (type: SleepingType) {
        if (this.type === type) return;
        if (this.type === SleepingType.NO_SLEEPING) {
            this.type = type;
            return;
        }
        this.type = type;

        for (const body of this.engine.world.sleepingBodies.values()) {
            body.setSleeping(SleepingState.AWAKE);
        }
    }

    /**
     * Updates the sleep state of bodies depending on their motion.
     * @param delta
     */
    update (delta: number) {
        switch (this.type) {
            case SleepingType.NO_SLEEPING: return;
            case SleepingType.BODY_SLEEPING:
                for (const body of this.engine.world.activeBodies.values()) {

                    if (body.motion <= Sleeping.MOTION_SLEEP_LIMIT) {
                        body.sleepyTimer += delta;
                    } else if (body.sleepyTimer > 0) {
                        body.sleepyTimer -= delta;
                    }

                    if (body.sleepyTimer >= Sleeping.SLEEPY_TIME_LIMIT) {
                        body.setSleeping(SleepingState.SLEEPING);
                    }
                }
                for (const body of this.engine.world.sleepingBodies.values()) {
                    if (body.force.x !== 0 || body.force.y !== 0) {
                        body.setSleeping(SleepingState.AWAKE);
                        continue;
                    }
                }
                break;
            case SleepingType.ISLAND_SLEEPING:
                // TODO
                break;
        }
    }

    /**
     * Updates the sleep state of bodies depending on their collisions.
     */
    afterCollisions () {

        switch (this.type) {
            case SleepingType.NO_SLEEPING: return;
            case SleepingType.BODY_SLEEPING:
                const pairs = this.engine.manager.activePairs;

                for (const pair of pairs) {
                    const bodyA = <Body>pair.shapeA.body;
                    const bodyB = <Body>pair.shapeB.body;
        
                    if (bodyA.sleepState !== SleepingState.SLEEPING && bodyB.sleepState !== SleepingState.SLEEPING) continue;
        
                    const bodyASleeping = bodyA.sleepState === SleepingState.SLEEPING;
                    const sleepingBody = bodyASleeping ? bodyA : bodyB;
        
                    if (sleepingBody.type !== BodyType.dynamic) continue;
        
                    const awakeBody = bodyASleeping ? bodyB : bodyA;
        
                    if (awakeBody.motion > Sleeping.COLLISION_MOTION_SLEEP_LIMIT) {
                        sleepingBody.setSleeping(SleepingState.AWAKE);
                    }
                }
        
                const endedPairs = this.engine.manager.endedPairs;
        
                for (const pair of endedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleeping(SleepingState.AWAKE);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleeping(SleepingState.AWAKE);
                }
        
                const startedPairs = this.engine.manager.startedPairs;
        
                for (const pair of startedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleeping(SleepingState.AWAKE);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleeping(SleepingState.AWAKE);
                }
                break;
            case SleepingType.ISLAND_SLEEPING:
                // TODO
                break;
        }
    }
}