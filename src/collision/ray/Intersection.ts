import { Body } from '../../body/Body';
import { Shape } from '../../body/shapes/Shape';
import { Common } from '../../common/Common';
import { RayContact } from './RayContact';

export class Intersection {
    body: Body;
    shape: Shape;
    id: number;
    isActive: boolean = false;
    contactsCount: number = 0;
    contacts: RayContact[] = [new RayContact(), new RayContact()];

    constructor (body: Body, shape: Shape) {
        this.body = body;
        this.shape = shape;

        this.id = Common.combineId(body.id, shape.id);
    }

    reset () {
        this.contactsCount = 0;
    }

}