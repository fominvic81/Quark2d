import { Vector } from '../../math/Vector';


export class Contact {

    constructor () {
        this.vertex = new Vector();
        this.normalImpulse = 0;
        this.tangentImpulse = 0;
        this.offsetA = new Vector();
        this.offsetB = new Vector();
        this.tangentShare = 0;
        this.normalShare = 0;
    }

}