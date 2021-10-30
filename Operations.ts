import { Matrix, vector } from "./Matrix.js"

export class Operations {

    static dotProduct = ([x1, y1, z1, w1]: vector, [x2, y2, z2, w2]: vector) => 
        x1*x2 + y1*y2 + z1*z2 + w1*w2

    static len = (v: vector) => Math.sqrt(Operations.dotProduct(v, v))

    static dist = ([x1, y1, z1, ]: vector, [x2, y2, z2, ]: vector) => 
        Operations.len([x2-x1, y2-y1, z2-z1, 0])

    static mulMatrixVector = (M: Matrix, v: vector): vector => [
        Operations.dotProduct(M.row(0), v),
        Operations.dotProduct(M.row(1), v),
        Operations.dotProduct(M.row(2), v),
        Operations.dotProduct(M.row(3), v)
    ]

    static _mulMatrixMatrix = (A: Matrix, B: Matrix) => Matrix.transposed(
        ...Operations.mulMatrixVector(A, B.col(0)),
        ...Operations.mulMatrixVector(A, B.col(1)),
        ...Operations.mulMatrixVector(A, B.col(2)),
        ...Operations.mulMatrixVector(A, B.col(3))
    )
    
    static mulMatrices = (...Ms: Matrix[]) =>
        Ms.reduce((prev, cur) => Operations._mulMatrixMatrix(prev, cur))

    static divPersp = ([x, y, z, w]: vector): vector => [x/w, y/w, z/w, 1]
    
}