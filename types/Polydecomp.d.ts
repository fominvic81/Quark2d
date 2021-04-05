declare module 'poly-decomp' {
    export function quickDecomp(polygon: [number, number][], result: [number, number][], reflexVertices: any[], steinerPoints: any[], delta: number, maxlevel: number, level: number): [number, number][][];
    export function makeCCW(polygon: [number, number][]): boolean;
    export function removeCollinearPoints(polygon: [number, number][], precision: number): number;
    export function decomp(polygon: [number, number][]): [number, number][][];
}