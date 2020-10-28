export const Common = {IDs: {}};

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
        return 'A' + idA + 'B' + idB;
    }
    return 'A' + idB + 'B' + idA;
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