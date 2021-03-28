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
    engine: any; // TODO-types
    type: number;

    static MOTION_SLEEP_LIMIT = 0.000018;
    static COLLISION_MOTION_SLEEP_LIMIT = 0.00004;
    static SLEEPY_TIME_LIMIT = 1;

    /**
     * @param engine
     * @param options
     */
    constructor (engine: any, options: SleepingOptions = {}) { // TODO-types

        this.engine = engine;
        this.type = options.type !== undefined ? options.type : SleepingType.BODY_SLEEPING;

    }

    /**
     * Updates the sleep state of bodies depending on their motion.
     * @param delta
     */
    update (delta: number) {
        if (this.type === SleepingType.NO_SLEEPING) return;

        if (this.type === SleepingType.BODY_SLEEPING) {
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
        } else if (this.type === SleepingType.ISLAND_SLEEPING) {
            // TODO
        }
    }

    /**
     * Updates the sleep state of bodies depending on their collisions.
     */
    afterCollisions () {

        const pairs = this.engine.manager.activePairs;

        for (const pair of pairs) {

            if (pair.bodyA.sleepState !== SleepingState.SLEEPING && pair.bodyB.sleepState !== SleepingState.SLEEPING) continue;

            const bodyASleeping = pair.bodyA.sleepState === SleepingState.SLEEPING;
            const sleepingBody = bodyASleeping ? pair.bodyA : pair.bodyB;
            
            if (sleepingBody.isStatic) continue;

            const awakeBody = bodyASleeping ? pair.bodyB : pair.bodyA;

            if (awakeBody.motion > Sleeping.COLLISION_MOTION_SLEEP_LIMIT) {
                sleepingBody.setSleeping(SleepingState.AWAKE);
            }
        }

        const endedPairs = this.engine.manager.endedPairs;

        for (const pair of endedPairs) {
            if (!pair.bodyA.isStatic) pair.bodyA.setSleeping(SleepingState.AWAKE);
            if (!pair.bodyB.isStatic) pair.bodyB.setSleeping(SleepingState.AWAKE);
        }

        const startedPairs = this.engine.manager.startedPairs;

        for (const pair of startedPairs) {
            if (!pair.bodyA.isStatic) pair.bodyA.setSleeping(SleepingState.AWAKE);
            if (!pair.bodyB.isStatic) pair.bodyB.setSleeping(SleepingState.AWAKE);
        }
    }
}