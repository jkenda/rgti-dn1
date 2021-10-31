import { SceneReader, Scene } from "./SceneReader.js"
import { Matrix } from "./Matrix.js"
import { Operations as O } from "./Operations.js"

const mulRot = {
    x: Math.PI / 800,
    y: Math.PI / 600
}

// enum
enum mouseBtn {
    none = -1, rotModel = 2, rotCamera = 0, moveModel = 1
}
enum keyboardKey {
    up = 'w', down = 's', left = 'a', right = 'd'
}

class Application {
    private static _singleInstance: Application = null

    private _mouseDown = mouseBtn.none
    private _mouseLocked = false
    private _scene: Scene
    private _cursorStyle: string
    
    private _mulTrans: number
    private _ctx: CanvasRenderingContext2D
    private _textarea: HTMLTextAreaElement

    private _mMatrix: Matrix
    private _vMatrix: Matrix
    private _pMatrix: Matrix
    private _c2wMatrix: Matrix

    private constructor(canvas: HTMLCanvasElement, textarea: HTMLTextAreaElement) {
        this._ctx = canvas.getContext("2d")
        this._ctx.translate(400, 300)
        this._textarea = textarea
        this._cursorStyle = canvas.style.cursor
        this.updateJSON()
    }

    public static getInstance(canvas: HTMLCanvasElement, textarea: HTMLTextAreaElement) {
        if (this._singleInstance == null) {
            this._singleInstance = new Application(canvas, textarea)
        }
        return this._singleInstance
    }

    public get cursorStyle() { return this._cursorStyle }
    public get hasScene() { return this._scene != null }

    public get mouseDown() { return this._mouseDown }
    public get mouseLocked() { return this._mouseLocked }

    public set mouseDown(btn: mouseBtn) { this._mouseDown = btn }
    public set mouseLocked(locked: boolean) { this._mouseLocked = locked }

    // posodobi transformacijsko matriko modela
    private _updateModelM() {
        console.time("mMatrix")
        const [sX, sY, sZ] = this._scene.model.scale
        const [aX, aY, aZ] = this._scene.model.rotation
        const [dX, dY, dZ] = this._scene.model.translation
        
        const scale = Matrix.scale(sX, sY, sZ)
        const rotateX = Matrix.rotateX(aX)
        const rotateY = Matrix.rotateY(aY)
        const rotateZ = Matrix.rotateZ(aZ)
        const translate = Matrix.translate(dX, dY, dZ)

        this._mMatrix = O.mulMatrices(translate, rotateX, rotateY, rotateZ, scale)
        console.timeEnd("mMatrix")
    }

    // posodobi transformacijsko matriko kamere
    private _updateViewM() {
        console.time("vMatrix")

        const [aX, aY, aZ] = this._scene.camera.rotation
        const [dX, dY, dZ] = this._scene.camera.translation
        
        // world to camera
        const rotateX = Matrix.rotateX(-aX)
        const rotateY = Matrix.rotateY(-aY)
        const rotateZ = Matrix.rotateZ(-aZ)
        const translate = Matrix.translate(-dX, -dY, -dZ)
        this._vMatrix = O.mulMatrices(rotateX, rotateY, rotateZ, translate)
        
        // camera to world
        const rotateXi = Matrix.rotateX(aX)
        const rotateYi = Matrix.rotateY(aY)
        const rotateZi = Matrix.rotateZ(aZ)
        const translatei = Matrix.translate(dX, dY, dZ)
        this._c2wMatrix = O.mulMatrices(translatei, rotateZi, rotateYi, rotateXi)

        const distance = O.dist(this._scene.camera.translation, this._scene.model.translation)
        this._mulTrans = distance * this._scene.camera.perspective

        console.timeEnd("vMatrix")
    }

    // posodobi projekcijsko matriko
    private _updateProjectionM() {
        console.time("pMatrix")
        this._pMatrix = Matrix.perspective(this._scene.camera.perspective)
        console.timeEnd("pMatrix")
    }

    // posodobi objekt scene iz JSONa
    public updateJSON() {
        console.time("JSON")
        this._scene = SceneReader.readFromJson(this._textarea.value)
        console.timeEnd("JSON")
    }

    // posodobi matrike
    public update() {
        this._updateModelM()
        this._updateViewM()
        this._updateProjectionM()
    }

    public rotateModel(x: number, y: number, z: number) {
        this._scene.model.rotation[0] += x
        this._scene.model.rotation[1] += y
        this._scene.model.rotation[2] += z
        this._updateModelM()
        this.render()
    }

    public moveModel(x: number, y: number, z: number) {
        const [dX, dY, dZ] = O.mulMatrixVector(this._c2wMatrix, [x, y, z, 0])
        this._scene.model.translation[0] += dX * this._mulTrans
        this._scene.model.translation[1] += dY * this._mulTrans
        this._scene.model.translation[2] += dZ * this._mulTrans
        this._updateModelM()
        this.render()
    }

    public rotateCamera(x: number, y: number, z: number) {
        this._scene.camera.rotation[0] += x
        this._scene.camera.rotation[1] += y
        this._scene.camera.rotation[2] += z
        this._updateViewM()
        this.render()
    }

    public moveCamera(x: number, y: number, z: number) {
        const [dX, dY, dZ] = O.mulMatrixVector(this._c2wMatrix, [x, y, z, 0])
        this._scene.camera.translation[0] += dX * this._mulTrans
        this._scene.camera.translation[1] += dY * this._mulTrans
        this._scene.camera.translation[2] += dZ * this._mulTrans
        this._updateViewM()
        this.render()
    }

    public render() {
        console.time("transform")
        const mvpMatrix = O.mulMatrices(this._pMatrix, this._vMatrix, this._mMatrix)
        const vertices = this._scene.vertices.map(
            (vec) => O.divPersp(O.mulMatrixVector(mvpMatrix, vec))
        )
        console.timeEnd("transform")

        console.time("draw")
        this._ctx.clearRect(-400, -300, 800, 600)
        this._ctx.beginPath()
        this._scene.triangles.forEach((triangle) => {
            const [a, b, c] = triangle
            
            // koordinate točk trikotnika
            const [aX, aY, aZ] = vertices[a]
            const [bX, bY, bZ] = vertices[b]
            const [cX, cY, cZ] = vertices[c]

            if (aZ <= 0 && bZ <= 0 && cZ <= 0) return
            
            // nariši črte
            this._ctx.moveTo(aX, aY)
            this._ctx.lineTo(bX, bY)
            this._ctx.lineTo(cX, cY)
            this._ctx.closePath()
        })
        this._ctx.stroke()
        console.timeEnd("draw")
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.querySelector("canvas")
    const textarea = document.querySelector("textarea")
    const app = Application.getInstance(canvas, textarea)

    if (app.hasScene) {
        app.update() 
        app.render()
    }

    // sprememba teksta modela
    textarea.addEventListener("input", () => {
        app.updateJSON()
        if (app.hasScene) {
            app.update()
            app.render()
        }
    })

    // premikanje modela z miško
    canvas.addEventListener("contextmenu", (event) =>  event.preventDefault())
    canvas.addEventListener("mousedown", (event) => {
        event.preventDefault()
        if (!app.hasScene) return
        app.mouseDown = event.button
        switch (event.button) {
            case mouseBtn.rotModel:
                canvas.style.cursor = "grabbing"
                break
            case mouseBtn.rotCamera:
                canvas.requestPointerLock()
                app.mouseLocked = true
                break
            case mouseBtn.moveModel:
                canvas.style.cursor = "move"
                break
        }
    })
    canvas.addEventListener("mousemove", (event) => {
        if (app.mouseDown == mouseBtn.none) return

        const dx = event.movementX
        const dy = event.movementY

        switch (app.mouseDown) {
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
        app.mouseDown = mouseBtn.none
        canvas.style.cursor = app.cursorStyle
        if (app.mouseLocked) {
            document.exitPointerLock()
            app.mouseLocked = false
        }
    })
    canvas.addEventListener("wheel", (event) => {
        event.preventDefault()
        if (event.deltaY < 0)
            canvas.style.cursor = "zoom-in"
        else
            canvas.style.cursor = "zoom-out"

        app.moveCamera(0, 0, -event.deltaY)

        setTimeout(() => { canvas.style.cursor = app.cursorStyle }, 600)
    })

    // premikanje modela s tipkovnico
    document.addEventListener("keydown", (event) => {
        if (!app.hasScene) return
        switch (event.key) {
            case keyboardKey.up:
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
