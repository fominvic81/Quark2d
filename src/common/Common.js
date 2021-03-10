export const Common = {
    IDs: {},
    PI05: Math.PI,
    PI: Math.PI,
    PI2: Math.PI * 2,
    PI3: Math.PI * 3,
};

Common.sign = (n) => {
    if (n >= 0) {
        return 1;
    } else {
        return -1;
    }
}

Common.nextId = (name = 'id') => {
    if (Common.IDs[name] === undefined) {
        Common.IDs[name] = -1;
    }

    ++Common.IDs[name];

    return Common.IDs[name];
};

Common.combineId = (idA, idB) => {
    if (idA < idB) {
        return (idA << 20) + idB;
    }
    return (idB << 20) + idA;
}

Common.clamp = (value, min, max) => {
    if (min > value) {
        return min;
    }
    if (max < value) {
        return max;
    }
    return value;
}

Common.contains = (value, min, max) => {
    return !(min > value || max < value);
}

Common.normaliseAngle = (angle) => {
    return ((angle % Common.PI2) + Common.PI3) % Common.PI2 - Common.PI
}

Common.angleDiff = (angleA, angleB) => {
    return Common.normaliseAngle(angleA - angleB);
};

Common.clampAngle = (angle, minAngle, maxAngle) => {
    if (maxAngle - minAngle < 0.01) return maxAngle;

    var minDiff = Common.angleDiff(angle, minAngle);
    var maxDiff = Common.angleDiff(angle, maxAngle);

    if (minDiff > 0 && maxDiff < 0) return angle;
    if (Math.abs(maxDiff) > Math.abs(minDiff)) return angle - minDiff;
    return angle - maxDiff;
};

Common.absMin = (a, b) => {
    if (Math.abs(a) < Math.abs(b)) {
        return a;
    } else {
        return b;
    }
}

Common.absMax = (a, b) => {
    if (Math.abs(a) > Math.abs(b)) {
        return a;
    } else {
        return b;
    }
}