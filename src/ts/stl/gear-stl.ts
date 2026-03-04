import type { Gear } from "../engine/gear";
import type { Point } from "../engine/point";
import type { Triangle } from "./stl-writer";
import { triangulatePolygon } from "./triangulate";
import { addSideWalls, generateCirclePoints } from "./extrude";
import type { Vec3 } from "./extrude";

interface GearStlOptions {
    thickness: number;
    scaleFactor: number;
    pegDiameter: number;
    holeClearance: number;
    snapHeadOverhang: number;
    chamferDepth: number;
    chamferClearance: number;
    idealToothSize?: number;
}

const HOLE_SEGMENTS = 48;

function buildGearStl(gear: Gear, options: GearStlOptions): Triangle[] {
    const outline = gear.buildOutlinePoints(options.idealToothSize);
    const scaledOutline: Point[] = outline.map(p => ({
        x: p.x * options.scaleFactor,
        y: p.y * options.scaleFactor,
    }));

    const holeRadius = (options.pegDiameter + options.holeClearance) / 2;
    const chamferTopRadius = (options.pegDiameter + 2 * options.snapHeadOverhang + options.chamferClearance) / 2;
    const chamferDepth = options.chamferDepth;
    const thickness = options.thickness;

    const triangles: Triangle[] = [];

    // Generate hole circles
    // Hole is CW (clockwise) when viewed from top so earcut treats it as a hole
    const holeBottom = generateCirclePoints(0, 0, holeRadius, HOLE_SEGMENTS).reverse();
    const holeChamferTop = generateCirclePoints(0, 0, chamferTopRadius, HOLE_SEGMENTS).reverse();
    // holeChamferBottom uses same radius as holeBottom

    // --- Bottom face (z=0): gear outline with hole ---
    const bottomIndices = triangulatePolygon(scaledOutline, [holeBottom]);
    const bottomAllPoints = [...scaledOutline, ...holeBottom];
    for (let i = 0; i < bottomIndices.length; i += 3) {
        const i0 = bottomIndices[i]!;
        const i1 = bottomIndices[i + 1]!;
        const i2 = bottomIndices[i + 2]!;
        const p0 = bottomAllPoints[i0]!;
        const p1 = bottomAllPoints[i1]!;
        const p2 = bottomAllPoints[i2]!;
        triangles.push({
            normal: { x: 0, y: 0, z: -1 },
            v1: { x: p0.x, y: p0.y, z: 0 },
            v2: { x: p2.x, y: p2.y, z: 0 },
            v3: { x: p1.x, y: p1.y, z: 0 },
        });
    }

    // --- Top face (z=thickness): gear outline with chamfer hole ---
    const topIndices = triangulatePolygon(scaledOutline, [holeChamferTop]);
    const topAllPoints = [...scaledOutline, ...holeChamferTop];
    for (let i = 0; i < topIndices.length; i += 3) {
        const i0 = topIndices[i]!;
        const i1 = topIndices[i + 1]!;
        const i2 = topIndices[i + 2]!;
        const p0 = topAllPoints[i0]!;
        const p1 = topAllPoints[i1]!;
        const p2 = topAllPoints[i2]!;
        triangles.push({
            normal: { x: 0, y: 0, z: 1 },
            v1: { x: p0.x, y: p0.y, z: thickness },
            v2: { x: p1.x, y: p1.y, z: thickness },
            v3: { x: p2.x, y: p2.y, z: thickness },
        });
    }

    // --- Outer side walls ---
    addSideWalls(triangles, scaledOutline, thickness, true);

    // --- Inner hole walls: bottom section (z=0 to z=thickness-chamferDepth) ---
    const chamferStartZ = thickness - chamferDepth;
    const holePointsCCW = generateCirclePoints(0, 0, holeRadius, HOLE_SEGMENTS);
    addCylinderWalls(triangles, holePointsCCW, 0, chamferStartZ, false);

    // --- Chamfer section (z=chamferStartZ to z=thickness) ---
    // Taper from holeRadius to chamferTopRadius
    const chamferBottomCCW = generateCirclePoints(0, 0, holeRadius, HOLE_SEGMENTS);
    const chamferTopCCW = generateCirclePoints(0, 0, chamferTopRadius, HOLE_SEGMENTS);
    addTaperedWalls(triangles, chamferBottomCCW, chamferTopCCW, chamferStartZ, thickness);

    return triangles;
}

function addCylinderWalls(triangles: Triangle[], points: Point[], zBottom: number, zTop: number, outward: boolean): void {
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const curr = points[i]!;
        const next = points[(i + 1) % n]!;

        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-10) continue;

        // Inward-facing normal for hole interior
        let nx: number, ny: number;
        if (outward) {
            nx = dy / len;
            ny = -dx / len;
        } else {
            nx = -dy / len;
            ny = dx / len;
        }
        const normal: Vec3 = { x: nx, y: ny, z: 0 };

        const bl: Vec3 = { x: curr.x, y: curr.y, z: zBottom };
        const br: Vec3 = { x: next.x, y: next.y, z: zBottom };
        const tl: Vec3 = { x: curr.x, y: curr.y, z: zTop };
        const tr: Vec3 = { x: next.x, y: next.y, z: zTop };

        // Inward winding
        triangles.push({ normal, v1: bl, v2: tr, v3: br });
        triangles.push({ normal, v1: bl, v2: tl, v3: tr });
    }
}

function addTaperedWalls(triangles: Triangle[], bottomRing: Point[], topRing: Point[], zBottom: number, zTop: number): void {
    const n = bottomRing.length;
    for (let i = 0; i < n; i++) {
        const bCurr = bottomRing[i]!;
        const bNext = bottomRing[(i + 1) % n]!;
        const tCurr = topRing[i]!;
        const tNext = topRing[(i + 1) % n]!;

        // Approximate inward-facing normal
        const midX = (bCurr.x + tCurr.x) / 2;
        const midY = (bCurr.y + tCurr.y) / 2;
        const len = Math.sqrt(midX * midX + midY * midY);
        const nx = len > 0 ? -midX / len : 0;
        const ny = len > 0 ? -midY / len : 0;
        const normal: Vec3 = { x: nx, y: ny, z: 0 };

        const bl: Vec3 = { x: bCurr.x, y: bCurr.y, z: zBottom };
        const br: Vec3 = { x: bNext.x, y: bNext.y, z: zBottom };
        const tl: Vec3 = { x: tCurr.x, y: tCurr.y, z: zTop };
        const tr: Vec3 = { x: tNext.x, y: tNext.y, z: zTop };

        triangles.push({ normal, v1: bl, v2: tr, v3: br });
        triangles.push({ normal, v1: bl, v2: tl, v3: tr });
    }
}

export { buildGearStl };
export type { GearStlOptions };
