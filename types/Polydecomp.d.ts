declare module 'poly-decomp' {
    export function quickDecomp(polygon: Array<[number, number]>, result: Array<[number, number]>, reflexVertices: Array<any>, steinerPoints: Array<any>, delta: number, maxlevel: number, level: number): Array<Array<[number, number]>>;
    export function makeCCW(polygon: Array<[number, number]>): boolean;
    export function removeCollinearPoints(polygon: Array<[number, number]>, precision: number): number;
    export function decomp(polygon: Array<[number, number]>): Array<Array<[number, number]>>;
}