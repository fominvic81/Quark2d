

export class Phase {

    constructor (engine) {
        this.engine = engine;
        this.world = engine.world;
        this.pairs = new Map();
        this.activePairsCount = 0;
    }

    update () {
        this.activePairsCount = 0;
    }
    
}