import { Vector } from '../math/Vector';

/**
 * The 'Grid' is the class for manipulating grids.
 */

export class Grid {
    private map: Map<number, any> = new Map();

    /**
     * Returns the value of the given position.
     * @param position
     * @returns The value of the given position
     */
    get (position: Vector): any {
        return this.map.get(this.getId(position));
    }

    /**
     * Sets the given value in the given position.
     * @param position
     * @param value
     */
    set (position: Vector, value: any) {
        this.map.set(this.getId(position), value);
    }

    /**
     * Removes value from the given position.
     * @param position
     */
    delete (position: Vector) {
        this.map.delete(this.getId(position));
    }

    /**
     * Returns the id of the given position.
     * @param position
     * @returns The id of the given position
     */
    getId (position: Vector): number {
        return (position.x << 20) + position.y;
    }

    /**
     * Returns the position of the given id.
     * @param id
     * @returns The position of the given id
     */
    getPositionById (id: number): Vector {
        const x = (id + 524288) >> 20;
        const y = id - (x << 20);

        return new Vector(x, y);
    }

    /**
     * Clears the grid.
     */
    clear () {
        this.map.clear();
    }

    /**
     * @returns Keys
     */
    keys (): Array<Vector> {

        const keys = [];

        for (const key of this.map.keys()) {
            keys.push(this.getPositionById(key));
        }

        return keys;
    }

    /**
     * @returns Values
     */
    values (): Array<any> {
        return [...this.map.values()];
    }

    /**
     * @returns Entries
     */
    entries (): Array<Array<any>> {
        const entries = [];

        for (const key of this.map.keys()) {
            entries.push([this.getPositionById(key), this.map.get(key)]);
        }

        return entries;
    }
}