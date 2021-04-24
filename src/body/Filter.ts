
/**
 * The 'Filter' is class for creating collision filters.
 */

import { Engine } from '../engine/Engine';

export class Filter {
    mask: number = 4294967295;
    category: number = 1;
    group: number = 0;
    private static group = 1;
    private static nonCollidingGroup = -1;

    /**
     * Creates a new filter.
     * @param mask
     * @param category
     * @param group
     */
    constructor (mask = 4294967295, category = 1, group = 0) {
        this.mask = mask;
        this.category = category;
        this.group = group;
    }

    /**
     * Returns true if the two given filters can collide.
     * @param filterA
     * @param filterB
     * @returns True if the two given filters can collide
     */
    static canCollide (filterA: Filter, filterB: Filter) {
        if (filterA.group === filterB.group && filterA.group) { 
            return filterA.group > 0;
        }

        return (filterA.mask & filterB.category) !== 0 && (filterB.mask & filterA.category) !== 0;
    }

    /**
     * @param engine
     * @returns The next unique category(there are 32 available)
     */
    static nextCategory (engine: Engine) {
        engine.category = engine.category << 1;
        return engine.category;
    }

    /**
     * If 'nonColliding' is false returns the next unique group for which bodies will collide,
     * otherwise returns the next unique group for which bodies will NOT collide.
     * @param engine
     * @param nonColliding
     * @returns The next unique group
     */
    static nextGroup (nonColliding = false) {
        if (nonColliding) {
            return this.nonCollidingGroup--;
        }
        return this.group++;
    }

}