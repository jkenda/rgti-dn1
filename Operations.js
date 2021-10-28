import { Matrix } from "./Matrix.js"

export class Operations {

    static dotProduct([x1, y1, z1, w1], [x2, y2, z2, w2]) {
        return x1*x2 + y1*y2 + z1*z2 + w1*w2;
    }

    static mulMatrixVector(M, v) {
        return [
            this.dotProduct(M.row(0), v),
            this.dotProduct(M.row(1), v),
            this.dotProduct(M.row(2), v),
            this.dotProduct(M.row(3), v)
        ]
    }

    static _mulMatrixMatrix(A, B) {
        return Matrix.transposed(
            ...this.mulMatrixVector(A, B.col(0)),
            ...this.mulMatrixVector(A, B.col(1)),
            ...this.mulMatrixVector(A, B.col(2)),
            ...this.mulMatrixVector(A, B.col(3))
        )
    }
    
    static mulMatrices(...Ms) {
        return Ms.reduce((prev, cur) => this._mulMatrixMatrix(prev, cur))
    }

    static divPersp([x, y, z, w]) {
        return [
            x / w,
            y / w,
            z / w
        ]
    }
    
}