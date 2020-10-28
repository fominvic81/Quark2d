
export class Filter {

    constructor (mask = 4294967295, category = 1, group = 0) {
        this.mask = mask;
        this.category = category;
        this.group = group;
    }

    static canCollide (filterA, filterB) {
        if (filterA.group === filterB.group && filterA.group) { 
            return filterA.group > 0;
        }

        return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    }

    static nextCategory () {
        Filter.category = Filter.category << 1;
        return Filter.category;
    }

    static nextGroup (nonColliding = false) {
        if (nonColliding) {
            return Filter.nonCollidingGroup--;
        }
        return Filter.group++;
    }

}

Filter.category = 1;
Filter.group = 1;
Filter.nonCollidingGroup = -1;