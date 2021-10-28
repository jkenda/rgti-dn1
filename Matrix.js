export class Matrix {

    constructor(...m) {
        this.m = new Array(16).fill(0)
        this.m.splice(0, m.length, ...m);
    }

    toArray() {
        return [...this.m];
    }

    toString() {
        return `(${this.m.join(',')})`;
    }
    // get row /num/ of the matrix
    row(num) {
        return [
            this.m[4 * num + 0],
            this.m[4 * num + 1],
            this.m[4 * num + 2],
            this.m[4 * num + 3]
        ]
    }

    // get column /num/ of the matrix
    col(num) {
        return [
            this.m[ 0 + num],
            this.m[ 4 + num],
            this.m[ 8 + num],
            this.m[12 + num]
        ]
    }

    // get element (i, j) of the matrix
    e(i, j) {
        return this.m[4 * i + j]
    }

    static identity() {
        return new Matrix(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        )
    }

    static transposed(...e) {
        return new Matrix(
            e[0], e[4], e[ 8], e[12],
            e[1], e[5], e[ 9], e[13],
            e[2], e[6], e[10], e[14],
            e[3], e[7], e[11], e[15]
          )
    }

    static rotateX(angle) {
        const s = Math.sin(angle)
        const c = Math.cos(angle)
        return new Matrix(
            1, 0,  0, 0,
            0, c, -s, 0,
            0, s,  c, 0,
            0, 0,  0, 1
        )
    }

    static rotateY(angle) {
        const s = Math.sin(angle)
        const c = Math.cos(angle)
        return new Matrix(
             c, 0, s, 0,
             0, 1, 0, 0,
            -s, 0, c, 0,
             0, 0, 0, 1
        )
    }

    static rotateZ(angle) {
        const s = Math.sin(angle)
        const c = Math.cos(angle)
        return new Matrix(
            c, -s, 0, 0,
            s,  c, 0, 0,
            0,  0, 1, 0,
            0,  0, 0, 1
        )
    }

    static translate(dx, dy, dz) {
        return new Matrix(
            1, 0, 0, dx,
            0, 1, 0, dy,
            0, 0, 1, dz,
            0, 0, 0, 1
        )
    }

    static scale(sx, sy, sz) {
        return new Matrix(
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0,  0, 1
        )
    }

    // d = 1 / tan(a/2) | a = kot FOV
    static perspective(d) {
        return new Matrix(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, d, 0
        )
    }
}
