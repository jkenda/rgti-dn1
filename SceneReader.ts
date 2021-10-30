import { vector } from "./Matrix"

export interface Scene {
    vertices: vector[],
    triangles: number[][],
    camera: {
        translation: [number, number, number],
        rotation: [number, number, number],
        perspective: number
    },
    model: {
        translation: [number, number, number],
        rotation: [number, number, number],
        scale: [number, number, number]
    }
}

export class SceneReader {
    static readFromJson(json: string): Scene {
        try {
            const data = JSON.parse(json)

            let scene: Scene

            const v: number[] = data.vertices
            const t: number[] = data.indices
            
            if (v.length % 3 != 0) return null
            if (t.length % 3 != 0) return null

            for (let i = 0; i < v.length; i += 3) {
                const [x, y, z] = v.slice(i, i+3)
                scene.vertices.push([x, y, z, 1])
            }
            
            for (let i = 0; i < t.length; i += 3) {
                const triangle = t.slice(i, i+3)
                scene.triangles.push(triangle)
            }

            scene.camera = data.camera
            scene.model  = data.model
            return scene
        }
        catch (error) {
            return null
        }
    }
}