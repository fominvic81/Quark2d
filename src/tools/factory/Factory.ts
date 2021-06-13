import { FactoryShape } from './FactoryShape';
import { FactoryBody } from './FactoryBody';

/**
 * Factory provides simple methods for creating bodies and shapes.
 */

export class Factory {
    static Shape = FactoryShape;
    static Body = FactoryBody;
}