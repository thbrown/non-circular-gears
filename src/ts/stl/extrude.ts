import type { Point } from "../engine/point";
import type { Triangle } from "./stl-writer";
import { triangulatePolygon } from "./triangulate";

type Vec3 = { x: number; y: number; z: number };

function extrudePolygon(outer: Point[], thickness: number, holes?: Point[][]): Triangle[] {
    const triangles: Triangle[] = [];

    // Combine all points for indexing: outer + holes
    const allPoints: Point[] = [...outer];
    if (holes) {
        for (const hole of holes) {
            allPoints.push(...hole);
        }
    }

    // Triangulate top and bottom faces
    const indices = triangulatePolygon(outer, holes);

    // Top face (z = thickness), normal up
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i]!;
        const i1 = indices[i + 1]!;
        const i2 = indices[i + 2]!;
        const p0 = allPoints[i0]!;
        const p1 = allPoints[i1]!;
        const p2 = allPoints[i2]!;
        triangles.push({
            normal: { x: 0, y: 0, z: 1 },
            v1: { x: p0.x, y: p0.y, z: thickness },
            v2: { x: p1.x, y: p1.y, z: thickness },
            v3: { x: p2.x, y: p2.y, z: thickness },
        });
    }

    // Bottom face (z = 0), normal down, reversed winding
    for (let i = 0; i < indices.length; i += 3) {
        const i0 = indices[i]!;
        const i1 = indices[i + 1]!;
        const i2 = indices[i + 2]!;
        const p0 = allPoints[i0]!;
        const p1 = allPoints[i1]!;
        const p2 = allPoints[i2]!;
        triangles.push({
            normal: { x: 0, y: 0, z: -1 },
            v1: { x: p0.x, y: p0.y, z: 0 },
            v2: { x: p2.x, y: p2.y, z: 0 },
            v3: { x: p1.x, y: p1.y, z: 0 },
        });
    }

    // Side walls for outer polygon
    addSideWalls(triangles, outer, thickness, true);

    // Side walls for holes (reversed winding since they face inward)
    if (holes) {
        for (const hole of holes) {
            addSideWalls(triangles, hole, thickness, false);
        }
    }

    return triangles;
}

function addSideWalls(triangles: Triangle[], points: Point[], thickness: number, outward: boolean): void {
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const curr = points[i]!;
        const next = points[(i + 1) % n]!;

        // Edge direction
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-10) continue;

        // Outward normal for outer, inward for holes
        let nx: number, ny: number;
        if (outward) {
            nx = dy / len;
            ny = -dx / len;
        } else {
            nx = -dy / len;
            ny = dx / len;
        }
        const normal: Vec3 = { x: nx, y: ny, z: 0 };

        const bl: Vec3 = { x: curr.x, y: curr.y, z: 0 };
        const br: Vec3 = { x: next.x, y: next.y, z: 0 };
        const tl: Vec3 = { x: curr.x, y: curr.y, z: thickness };
        const tr: Vec3 = { x: next.x, y: next.y, z: thickness };

        if (outward) {
            triangles.push({ normal, v1: bl, v2: br, v3: tr });
            triangles.push({ normal, v1: bl, v2: tr, v3: tl });
        } else {
            triangles.push({ normal, v1: bl, v2: tr, v3: br });
            triangles.push({ normal, v1: bl, v2: tl, v3: tr });
        }
    }
}

function generateCirclePoints(cx: number, cy: number, radius: number, segments: number): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        });
    }
    return points;
}

export { extrudePolygon, generateCirclePoints, addSideWalls };
export type { Vec3 };
