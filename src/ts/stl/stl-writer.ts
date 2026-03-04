type Triangle = {
    normal: { x: number; y: number; z: number };
    v1: { x: number; y: number; z: number };
    v2: { x: number; y: number; z: number };
    v3: { x: number; y: number; z: number };
};

function buildStlBuffer(triangles: Triangle[]): ArrayBuffer {
    const HEADER_SIZE = 80;
    const TRIANGLE_COUNT_SIZE = 4;
    const BYTES_PER_TRIANGLE = 50; // 12 floats * 4 bytes + 2 byte attribute
    const bufferSize = HEADER_SIZE + TRIANGLE_COUNT_SIZE + triangles.length * BYTES_PER_TRIANGLE;

    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);

    // 80-byte header (zeros)
    // uint32 triangle count
    view.setUint32(HEADER_SIZE, triangles.length, true);

    let offset = HEADER_SIZE + TRIANGLE_COUNT_SIZE;
    for (const tri of triangles) {
        // normal
        view.setFloat32(offset, tri.normal.x, true); offset += 4;
        view.setFloat32(offset, tri.normal.y, true); offset += 4;
        view.setFloat32(offset, tri.normal.z, true); offset += 4;
        // vertex 1
        view.setFloat32(offset, tri.v1.x, true); offset += 4;
        view.setFloat32(offset, tri.v1.y, true); offset += 4;
        view.setFloat32(offset, tri.v1.z, true); offset += 4;
        // vertex 2
        view.setFloat32(offset, tri.v2.x, true); offset += 4;
        view.setFloat32(offset, tri.v2.y, true); offset += 4;
        view.setFloat32(offset, tri.v2.z, true); offset += 4;
        // vertex 3
        view.setFloat32(offset, tri.v3.x, true); offset += 4;
        view.setFloat32(offset, tri.v3.y, true); offset += 4;
        view.setFloat32(offset, tri.v3.z, true); offset += 4;
        // attribute byte count
        view.setUint16(offset, 0, true); offset += 2;
    }

    return buffer;
}

export { buildStlBuffer };
export type { Triangle };
