import { Matrix, vector } from "./Matrix"

export class MatrixOperations {

    static dotProduct([x1, y1, z1, w1]: vector, [x2, y2, z2, w2]: vector): number {
        return x1*x2 + y1*y2 + z1*z2 + w1*w2;
    }

    static len(v: vector): number {
        return Math.sqrt(this.dotProduct(v, v))
    }

    static dist([x1, y1, z1, ]: vector, [x2, y2, z2, ]: vector): number {
        return this.len([x2-x1, y2-y1, z2-z1, 0])
    }

    static mulMatrixVector(M: Matrix, v: vector): vector {
        return [
            this.dotProduct(M.row(0), v),
            this.dotProduct(M.row(1), v),
            this.dotProduct(M.row(2), v),
            this.dotProduct(M.row(3), v)
        ]
    }

    static _mulMatrixMatrix(A: Matrix, B: Matrix): Matrix {
        return Matrix.transposed(
            ...this.mulMatrixVector(A, B.col(0)),
            ...this.mulMatrixVector(A, B.col(1)),
            ...this.mulMatrixVector(A, B.col(2)),
            ...this.mulMatrixVector(A, B.col(3))
        )
    }
    
    static mulMatrices(...Ms: Matrix[]) {
        return Ms.reduce((prev, cur) => this._mulMatrixMatrix(prev, cur))
    }

    static divPersp([x, y, z, w]: vector): vector {
        return [
            x / w,
            y / w,
            z / w, 
            1
        ]
    }
    
}