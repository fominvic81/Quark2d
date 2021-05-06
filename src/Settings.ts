
const depthDamping = 0.7;
const slop = 0.005;

export const Settings = {
    restitutionThreshold: 0.03,

    depthDamping,
    positionImpulseDamping: 1-depthDamping,
    constraintImpulseDamping: 0.4,

    slop,
    defaultRadius: 2 * slop,

    maxGJKIterations: 30,
    maxEPAIterations: 40,

    motionSleepLimit: 0.000018,
    collisionMotionSleepLimit: 0.00004,
    sleepyTime: 1,
}