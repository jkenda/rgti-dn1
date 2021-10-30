import { SceneReader, Scene } from "./SceneReader.js"
import { Matrix, vector } from "./Matrix.js"
import { Operations as O } from "./Operations.js"

const mulRot = {
    x: Math.PI / 800,
    y: Math.PI / 600
}

const mouseBtn = {
    rotModel: 2, rotCamera: 0, moveModel: 1
}
const keyboardKey = {
    up: 'w', down: 's', left: 'a', right: 'd'
}

class Application {
    mouse = { 
        down: -1,
        locked: false
    }
    scene: Scene
    ctx: CanvasRenderingContext2D
    textarea: HTMLTextAreaElement
    mul_trans: number

    mMatrix: Matrix
    vMatrix: Matrix
    pMatrix: Matrix
    c2wMatrix: Matrix

    constructor(canvas: HTMLCanvasElement, textarea: HTMLTextAreaElement) {
        this.ctx = canvas.getContext("2d")
        this.ctx.translate(400, 300)
        this.textarea = textarea
        this.updateJSON()
    }

    // posodobi transformacijsko matriko modela
    updateModelM(): void {
        console.time("mMatrix")
        const [sX, sY, sZ] = this.scene.model.scale
        const [aX, aY, aZ] = this.scene.model.rotation
        const [dX, dY, dZ] = this.scene.model.translation
        
        const scale = Matrix.scale(sX, sY, sZ)
        const rotateX = Matrix.rotateX(aX)
        const rotateY = Matrix.rotateY(aY)
        const rotateZ = Matrix.rotateZ(aZ)
        const translate = Matrix.translate(dX, dY, dZ)

        this.mMatrix = O.mulMatrices(translate, rotateX, rotateY, rotateZ, scale)
        console.timeEnd("mMatrix")
    }

    // posodobi transformacijsko matriko kamere
    updateViewM(): void {
        console.time("vMatrix")

        const [aX, aY, aZ] = this.scene.camera.rotation
        const [dX, dY, dZ] = this.scene.camera.translation
        
        // world to camera
        const rotateX = Matrix.rotateX(-aX)
        const rotateY = Matrix.rotateY(-aY)
        const rotateZ = Matrix.rotateZ(-aZ)
        const translate = Matrix.translate(-dX, -dY, -dZ)
        this.vMatrix = O.mulMatrices(rotateX, rotateY, rotateZ, translate)
        
        // camera to world
        const rotateXi = Matrix.rotateX(aX)
        const rotateYi = Matrix.rotateY(aY)
        const rotateZi = Matrix.rotateZ(aZ)
        const translatei = Matrix.translate(dX, dY, dZ)
        this.c2wMatrix = O.mulMatrices(translatei, rotateZi, rotateYi, rotateXi)

        const distance = O.dist([...this.scene.camera.translation, 0], [...this.scene.model.translation, 0])
        this.mul_trans = distance * this.scene.camera.perspective

        console.timeEnd("vMatrix")
    }

    // posodobi projekcijsko matriko
    updateProjectionM(): void {
        console.time("pMatrix")
        this.pMatrix = Matrix.perspective(this.scene.camera.perspective)
        console.timeEnd("pMatrix")
    }

    // posodobi objekt scene iz JSONa
    updateJSON(): void {
        console.time("JSON")
        this.scene = SceneReader.readFromJson(this.textarea.value)
        console.timeEnd("JSON")
    }

    update(): void {
        this.updateModelM()
        this.updateViewM()
        this.updateProjectionM()
    }

    rotateModel(x: number, y: number, z: number): void {
        const [aX, aY, aZ] = O.mulMatrixVector(this.c2wMatrix, [x, y, z, 0])
        this.scene.model.rotation[0] += aX
        this.scene.model.rotation[1] += aY
        this.scene.model.rotation[2] += aZ
        this.updateModelM()
        this.render()
    }

    moveModel(x: number, y: number, z: number): void {
        const [dX, dY, dZ] = O.mulMatrixVector(this.c2wMatrix, [x, y, z, 0])
        this.scene.model.translation[0] += dX * this.mul_trans
        this.scene.model.translation[1] += dY * this.mul_trans
        this.scene.model.translation[2] += dZ * this.mul_trans
        this.updateModelM()
        this.render()
    }

    rotateCamera(x: number, y: number, z: number): void {
        const [aX, aY, aZ] = O.mulMatrixVector(this.c2wMatrix, [x, y, z, 0])
        this.scene.camera.rotation[0] += aX
        this.scene.camera.rotation[1] += aY
        this.scene.camera.rotation[2] += aZ
        this.updateViewM()
        this.render()
    }

    moveCamera(x: number, y: number, z: number): void {
        const [dX, dY, dZ] = O.mulMatrixVector(this.c2wMatrix, [x, y, z, 0])
        this.scene.camera.translation[0] += dX * this.mul_trans
        this.scene.camera.translation[1] += dY * this.mul_trans
        this.scene.camera.translation[2] += dZ * this.mul_trans
        this.updateViewM()
        this.render()
    }

    render(): void {
        console.time("transform")
        const mvpMatrix = O.mulMatrices(this.pMatrix, this.vMatrix, this.mMatrix)
        const vertices = this.scene.vertices.map(
            v => O.divPersp(O.mulMatrixVector(mvpMatrix, v))
        )
        console.timeEnd("transform")

        console.time("draw")
        this.ctx.clearRect(-400, -300, 800, 600)
        this.ctx.beginPath()
        this.scene.triangles.forEach(triangle => {
            const [a, b, c] = triangle
            
            // koordinate točk trikotnika
            const [aX, aY, aZ] = vertices[a]
            const [bX, bY, bZ] = vertices[b]
            const [cX, cY, cZ] = vertices[c]

            if (aZ <= 0 && bZ <= 0 && cZ <= 0) return
            
            // nariši črte
            this.ctx.moveTo(aX, aY)
            this.ctx.lineTo(bX, bY)
            this.ctx.lineTo(cX, cY)
            this.ctx.closePath()
        })
        this.ctx.stroke()
        console.timeEnd("draw")
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.querySelector("canvas")
    const textarea = document.querySelector("textarea")
    const app = new Application(canvas, textarea)
    const cursor_style = canvas.style.cursor

    canvas.requestPointerLock = canvas.requestPointerLock;
    document.exitPointerLock  = document.exitPointerLock;

    if (app.scene) {
        app.update() 
        app.render()
    }

    // sprememba teksta modela
    textarea.addEventListener("input", () => {
        app.updateJSON()
        if (app.scene) {
            app.update()
            app.render()
        }
    })

    // premikanje modela z miško
    canvas.addEventListener("contextmenu", (event) =>  event.preventDefault())
    canvas.addEventListener("mousedown", (event) => {
        event.preventDefault()
        if (!app.scene) return
        app.mouse.down = event.button
        switch (event.button) {
            case mouseBtn.rotModel:
                canvas.style.cursor = "grabbing"
                break
            case mouseBtn.rotCamera:
                canvas.requestPointerLock()
                app.mouse.locked = true
                break
            case mouseBtn.moveModel:
                canvas.style.cursor = "move"
                break
        }
    })
    canvas.addEventListener("mousemove", (event) => {
        if (app.mouse.down == -1) return

        const dx = event.movementX
        const dy = event.movementY

        switch (app.mouse.down) {
            case mouseBtn.rotModel: // middle button
                app.rotateModel(dy*mulRot.y, -dx*mulRot.x, 0)
                break;
            case mouseBtn.rotCamera: // left buton
                app.rotateCamera(-dy*mulRot.y, dx*mulRot.x, 0)
                break;
            case mouseBtn.moveModel: // right button
                app.moveModel(dx, dy, 0)
                break;
        }
    })
    canvas.addEventListener("mouseup", () => {
        app.mouse.down = -1
        canvas.style.cursor = cursor_style
        if (app.mouse.locked) {
            document.exitPointerLock()
            app.mouse.locked = false
        }
    })
    canvas.addEventListener("wheel", (event) => {
        event.preventDefault()
        if (event.deltaY < 0)
            canvas.style.cursor = "zoom-in"
        else
            canvas.style.cursor = "zoom-out"

        app.moveCamera(0, 0, -event.deltaY)

        setTimeout(() => { canvas.style.cursor = cursor_style }, 600)
    })

    // premikanje modela s tipkovnico
    document.addEventListener("keydown", (event) => {
        if (!app.scene) return
        switch (event.key) {
            case keyboardKey.down:
                app.moveCamera(0, -10, 0)
                break
            case keyboardKey.down:
                app.moveCamera(0, 10, 0)
                break
            case keyboardKey.left:
                app.moveCamera(-10, 0, 0)
                break
            case keyboardKey.right:
                app.moveCamera(10, 0, 0)
                break
        }
    })
})
