import { SceneReader } from "./SceneReader.js"
import { Matrix } from "./Matrix.js"
import { Operations as O } from "./Operations.js"

const mul_rot = {
    x: Math.PI / 800,
    y: Math.PI / 600
}

class Application {

    constructor(canvas, textarea) {
        this.mouse = { 
            down: -1,
            prev: { x: 0, y: 0 } }
        this.ctx = canvas.getContext("2d")
        this.ctx.translate(400, 300)
        this.textarea = textarea
        this.updateJSON()
    }

    // posodobi transformacijsko matriko modela
    updateModelM() {
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
    updateViewM() {
        console.time("vMatrix")
        const [aX, aY, aZ] = this.scene.camera.rotation
        const [dX, dY, dZ] = this.scene.camera.translation
        const rotateX = Matrix.rotateX(-aX)
        const rotateY = Matrix.rotateY(-aY)
        const rotateZ = Matrix.rotateZ(-aZ)
        const translate = Matrix.translate(-dX, -dY, -dZ)
        
        this.mul_trans = -this.scene.camera.translation[2] * this.scene.camera.perspective
        this.vMatrix = O.mulMatrices(rotateX, rotateY, rotateZ, translate)
        console.timeEnd("vMatrix")
    }

    // posodobi projekcijsko matriko
    updateProjectionM() {
        console.time("pMatrix")
        this.pMatrix = Matrix.perspective(this.scene.camera.perspective)
        console.timeEnd("pMatrix")
    }

    // posodobi objekt scene iz JSONa
    updateJSON(json) {
        console.time("JSON")
        this.scene = SceneReader.readFromJson(this.textarea.value)
        console.timeEnd("JSON")
    }

    update() {
        this.updateModelM()
        this.updateViewM()
        this.updateProjectionM()
    }

    rotateModel(x, y, z) {
        this.scene.model.rotation[0] += x
        this.scene.model.rotation[1] += y
        this.scene.model.rotation[2] += z
        this.updateModelM()
        this.render()
    }

    rotateCamera(x, y, z) {
        this.scene.camera.rotation[0] += x
        this.scene.camera.rotation[1] += y
        this.scene.camera.rotation[2] += z
        this.updateViewM()
        this.render()
    }

    moveModel(x, y, z) {
        this.scene.model.translation[0] += x
        this.scene.model.translation[1] += y
        this.scene.model.translation[2] += z
        this.updateModelM()
        this.render()
    }

    moveCamera(x, y, z) {
        this.scene.camera.translation[0] += x
        this.scene.camera.translation[1] += y
        this.scene.camera.translation[2] += z
        this.updateViewM()
        this.render()
    }

    render() {
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

            if (aZ <= 0 || bZ <= 0 || cZ <= 0) return
            
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

    console.log((new Matrix(1, 2, 3)).toArray())

    const canvas = document.querySelector("canvas")
    const textarea = document.querySelector("textarea")
    const app = new Application(canvas, textarea)
    const cursor_style = canvas.style.cursor

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
        if (!app.scene) return
        event.preventDefault()
        app.mouse.prev = { x: event.clientX, y: event.clientY }
        app.mouse.down = event.button
        switch (event.button) {
            case 0:
                canvas.style.cursor = "grabbing"
                break
            case 1:
                canvas.style.cursor = "all-scroll"
                break
            case 2:
                canvas.style.cursor = "move"
                break
        }
    })
    canvas.addEventListener("mousemove", (event) => {
        if (app.mouse.down == -1) return

        const curr = { x: event.clientX, y: event.clientY }
        const prev = app.mouse.prev
        const dx = curr.x - prev.x
        const dy = curr.y - prev.y

        const mul_trans = app.mul_trans

        switch (app.mouse.down) {
            case 0: // left button
                app.rotateModel(dy*mul_rot.y, -dx*mul_rot.x, 0)
                break;
            case 1: // muddle buton
                app.rotateCamera(dy*mul_rot.y, -dx*mul_rot.x, 0)
                break;
            case 2: // right button
                app.moveModel(dx*mul_trans, dy*mul_trans, 0)
                break;
        }

        app.mouse.prev = curr
    })
    canvas.addEventListener("mouseup", () => {
        app.mouse.down = -1
        canvas.style.cursor = cursor_style
    })
    canvas.addEventListener("wheel", (event) => {
        event.preventDefault()
        if (event.deltaY < 0)
            canvas.style.cursor = "zoom-in"
        else
            canvas.style.cursor = "zoom-out"

        const multiplier = -app.mul_trans
        app.moveCamera(0, 0, event.deltaY * multiplier)

        setTimeout(() => { canvas.style.cursor = cursor_style }, 600)
    })

    // premikanje modela s tipkovnico
    document.addEventListener("keydown", (event) => {
        if (!app.scene) return
        const mul = app.mul_trans
        switch (event.key) {
            case "w":
                app.moveCamera(0, -10*mul, 0)
                break
            case "s":
                app.moveCamera(0, 10*mul, 0)
                break
            case "a":
                app.moveCamera(-10*mul, 0, 0)
                break
            case "d":
                app.moveCamera(10*mul, 0, 0)
                break
        }
    })
})
