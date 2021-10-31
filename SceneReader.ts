import { vec4, vec3 } from "./Matrix.js"

export interface Scene {
    vertices: vec4[],
    triangles: vec3[],
    camera: {
        translation: vec3,
        rotation: vec3,
        perspective: number
    },
    model: {
        translation: vec3,
        rotation: vec3,
        scale: vec3
    }
}

export class SceneReader {
    static readFromJson(json: string): Scene {
        try {
            const data = JSON.parse(json)

            let scene: Scene = {
                vertices: [],
                triangles: [],
                camera: {
                    translation: [0, 0, 0],
                    rotation: [0, 0, 0],
                    perspective: 0
                },
                model: {
                    translation: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [0, 0, 0]
                }
            }

            const v: number[] = data.vertices
            const t: number[] = data.indices
            
            if (v.length % 3 != 0) throw new Error("invalid number of vertices: " + v.length)
            if (t.length % 3 != 0) throw new Error("invalid number of triangles: " + t.length)

            for (let i = 0; i < v.length; i += 3) {
                const [x, y, z] = v.slice(i, i+3)
                scene.vertices.push([x, y, z, 1])
            }
            
            for (let i = 0; i < t.length; i += 3) {
                const [a, b, c] = t.slice(i, i+3)
                scene.triangles.push([a, b, c])
            }

            if ("camera" in data) scene.camera = data.camera
            if ("model"  in data) scene.model  = data.model
            return scene
        }
        catch (error) {
            console.error(error)
            return null
        }
    }
}