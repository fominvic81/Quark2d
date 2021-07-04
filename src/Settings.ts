
const slop = 0.005;

export const Settings = {
    restitutionThreshold: 0.015,

    depthDamping: 0.3,

    slop,
    defaultRadius: 2 * slop,
    defaultDensity: 100,
    defaultRestitution: 0.1,
    defaultFriction: 0.4,

    maxGJKIterations: 30,
    maxEPAIterations: 40,

    motionSleepLimit: 0.000018,
    collisionMotionSleepLimit: 0.00004,
    sleepyTime: 1,
}