
const slop = 0.005;

export const Settings = {
    restitutionThreshold: 0.005,

    depthDamping: 0.7,
    constraintImpulseDamping: 0.4,

    slop,
    defaultRadius: 2 * slop,

    maxGJKIterations: 30,
    maxEPAIterations: 40,

    motionSleepLimit: 0.000018,
    collisionMotionSleepLimit: 0.00004,
    sleepyTime: 1,
}