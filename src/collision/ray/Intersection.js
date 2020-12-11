import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';


export class Intersection {

    constructor (body, shape) {
        this.body = body;
        this.shape = shape;

        this.id = Common.combineId(body.id, shape.id)

        this.isActive = false;

        this.contactsCount = 0;
        this.contacts = [
            {
                point: new Vector(),
                normal: new Vector(),
            },
            {
                point: new Vector(),
                normal: new Vector(),
            },
        ];
    }

    reset () {
        this.contactsCount = 0;
    }

}