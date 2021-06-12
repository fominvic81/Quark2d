import { Shape } from '../../body/shapes/Shape';
import { RayContact } from './RayContact';

export class Intersection {
    shape: Shape;
    contactsCount: number = 0;
    contacts: RayContact[] = [new RayContact(), new RayContact()];

    constructor (shape: Shape) {
        this.shape = shape;
    }
}