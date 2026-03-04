import earcut from "earcut";
import type { Point } from "../engine/point";

function triangulatePolygon(outer: Point[], holes?: Point[][]): number[] {
    const coords: number[] = [];
    const holeIndices: number[] = [];

    for (const p of outer) {
        coords.push(p.x, p.y);
    }

    if (holes) {
        for (const hole of holes) {
            holeIndices.push(coords.length / 2);
            for (const p of hole) {
                coords.push(p.x, p.y);
            }
        }
    }

    return earcut(coords, holeIndices.length > 0 ? holeIndices : undefined);
}

export { triangulatePolygon };
