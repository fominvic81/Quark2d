import { Vector } from '../math/Vector';


export class Grid {

    constructor () {
        
        this.map = new Map();

    }

    get (position) {
        return this.map.get(this.getId(position));
    }

    set (position, value) {
        return this.map.set(this.getId(position), value);
    }

    delete (position) {
        this.map.delete(this.getId(position));
    }

    getId (position) {
        return position.x + 'o' + position.y;
    }

    getPositionById (id) {
        const [x, y] = id.split('o').map(i => Number(i));

        return new Vector(x, y);
    }

    clear () {
        this.map.clear();
    }

    keys () {

        const keys = [];

        for (const key of this.map.keys()) {
            keys.push(this.getPositionById(key));
        }

        return keys;
        
    }

    values () {
        return [...this.map.values()];
    }

    entries () {
        const entries = [];

        for (const key of this.map.keys()) {
            entries.push([this.getPositionById(key), this.map.get(key)]);
        }

        return entries;
    }

}