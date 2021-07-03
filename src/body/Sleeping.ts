import { Engine } from '../engine/Engine';
import { Settings } from '../Settings';
import { BodyType } from './Body';

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

export interface SleepingOptions {
    type?: SleepingType;
}

/**
 * The 'Sleeping is a class for manage the sleeping of bodies.
 */

export class Sleeping {
    engine: Engine;
    type: number;

    /**
     * @param engine
     * @param options
     */
    constructor (engine: Engine, options: SleepingOptions = {}) {

        this.engine = engine;
        this.type = options.type !== undefined ? options.type : SleepingType.NO_SLEEPING;

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
            body.setSleepingState(SleepingState.AWAKE);
        }
    }

    /**
     * Updates the sleep state of bodies depending on their motion.
     * @param delta
     */
    afterSolve (delta: number) {

        const motionSleepLimit = Settings.motionSleepLimit;
        const sleepyTime = Settings.sleepyTime;

        const sleeping = SleepingState.SLEEPING;

        switch (this.type) {
            case SleepingType.NO_SLEEPING: return;
            case SleepingType.BODY_SLEEPING:
                for (const body of this.engine.world.activeBodies.values()) {
                    if (!body.canSleep) continue;

                    if (body.motion <= motionSleepLimit) {
                        body.sleepyTimer += delta;
                    } else if (body.sleepyTimer > 0) {
                        body.sleepyTimer -= delta;
                    }

                    if (body.sleepyTimer >= sleepyTime) {
                        body.setSleepingState(sleeping);
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

        const collisionMotionSleepLimit = Settings.collisionMotionSleepLimit;

        const sleeping = SleepingState.SLEEPING;
        const awake = SleepingState.AWAKE;

        switch (this.type) {
            case SleepingType.NO_SLEEPING: return;
            case SleepingType.BODY_SLEEPING:
                const pairs = this.engine.manager.activePairs;

                for (const pair of pairs) {
                    const bodyA = pair.shapeA.body!;
                    const bodyB = pair.shapeB.body!;
        
                    if (bodyA.sleepState !== sleeping && bodyB.sleepState !== sleeping) continue;
        
                    const bodyASleeping = bodyA.sleepState === sleeping;
                    const sleepingBody = bodyASleeping ? bodyA : bodyB;
        
                    if (sleepingBody.type !== BodyType.dynamic) continue;
        
                    const awakeBody = bodyASleeping ? bodyB : bodyA;
        
                    if (awakeBody.motion > collisionMotionSleepLimit) {
                        sleepingBody.setSleepingState(awake);
                    }
                }
        
                const endedPairs = this.engine.manager.endedPairs;
        
                for (const pair of endedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleepingState(awake);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleepingState(awake);
                }
        
                const startedPairs = this.engine.manager.startedPairs;
        
                for (const pair of startedPairs) {
                    if (pair.shapeA.body?.type === BodyType.dynamic) pair.shapeA.body?.setSleepingState(awake);
                    if (pair.shapeB.body?.type === BodyType.dynamic) pair.shapeB.body?.setSleepingState(awake);
                }
                break;
            case SleepingType.ISLAND_SLEEPING:
                // TODO
                break;
        }
    }
}