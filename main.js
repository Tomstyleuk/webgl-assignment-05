import { WebGLUtility } from './lib/webgl.js';

window.addEventListener('DOMContentLoaded', async () => {
    const app = new App()
    app.init()
    await app.load()
    app.setupGeometry()
    app.setupLocation()
    app.start()
}, false)

class App {
    constructor() {
        this.render = this.render.bind(this);
    }


    /**
     * Create Webgl context & Set up canvas size
     */
    init() {
        // Create Webgl context
        this.canvas = document.getElementById('webgl-canvas')
        this.gl = WebGLUtility.createWebGLContext(this.canvas)

        // Set canvas size 1:1
        const size = Math.min(window.innerWidth, window.innerHeight)
        this.canvas.width = size
        this.canvas.height = size
    }


    /**
     * Load shader files
     */
    async load() {
        return new Promise(async (resolve, reject) => {
            // To optimise code, store webgl context in a variable
            const gl = this.gl

            // Check webgl context is existed
            if (gl === null) {
                const error = new Error('not initialised')
                reject(error)
            } else {
                // 1. Load shader files
                const VSSrouce = await WebGLUtility.loadFile('main.vert')
                const FSSrouce = await WebGLUtility.loadFile('main.frag')

                // 2. Create shader object
                const vertexShader = WebGLUtility.createShaderObject(gl, VSSrouce, gl.VERTEX_SHADER)
                const fragmentShader = WebGLUtility.createShaderObject(gl, FSSrouce, gl.FRAGMENT_SHADER)

                // 3.Store them in a program object to send it to GPU
                resolve()
                this.program = WebGLUtility.createProgramObject(gl, vertexShader, fragmentShader)
            }
        })
    }


    /**
     * Create Geometry
     */
    setupGeometry() {
        const outerCircle = this.createCircle(0.5, 64);
        const innerCircle = this.createCircle(0.4, 64);
        const star = this.createStar(0.4);

        this.position = [...outerCircle, ...innerCircle, ...star];
        this.positionStride = 3;
        this.positionVBO = WebGLUtility.createVBO(this.gl, this.position);

        // Create color array
        /**
         * 各円は64個のセグメントで構成され、各セグメントは3つの頂点（三角形）で構成されている
         * 1つの円は64 * 3個の頂点を持ち、2つの円では64 * 3 * 2個の頂点になる
         */
        const circleColor = new Array((64 * 3 * 2) * 4).fill(1.0); // White color for circles

        /**
         * 星形を構成する2つの三角形には、合計6個の頂点があり、各頂点にRGBAの4つの色成分がある
         */
        const starColor = new Array(6 * 4).fill(0.0);
        for (let i = 0; i < 6; i++) {
            starColor[i * 4] = 0.6;     // R
            starColor[i * 4 + 1] = 0.5; // G
            starColor[i * 4 + 2] = 0.8; // B
            starColor[i * 4 + 3] = 1.0; // A
        }
        this.color = [...circleColor, ...starColor];
        this.colorStride = 4;
        this.colorVBO = WebGLUtility.createVBO(this.gl, this.color);
    }


    /**
     * Create Circle
     * @param {*} radius
     * @param {*} segments
     * @returns
     */
    createCircle(radius, segments) {
        const vertices = [];
        for (let i = 0; i < segments; i++) {
            // Calcurate each angle for a radian(2PI)
            const theta1 = (i / segments) * Math.PI * 2;

            // Calcurate next angle for a radian(2PI)
            const theta2 = ((i + 1) / segments) * Math.PI * 2;

            vertices.push(
                0, 0, 0,  // Center point
                Math.cos(theta1) * radius, Math.sin(theta1) * radius, 0.0,
                Math.cos(theta2) * radius, Math.sin(theta2) * radius, 0.0
            );
        }
        return vertices;
    }


    /**
     * Create Star
     * @param {*} radius
     * @returns
     */
    createStar(radius) {
        const vertices = [];

        // Angles for the first triangle
        const angles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];

        // Angles for the second triangle
        const anglesOffset = [Math.PI, Math.PI * 5 / 3, Math.PI * 7 / 3];

        // First triangle
        for (let i = 0; i < 3; i++) {
            vertices.push(
                Math.cos(angles[i]) * radius,
                Math.sin(angles[i]) * radius,
                0.0
            );
        }

        // Second triangle
        for (let i = 0; i < 3; i++) {
            vertices.push(
                Math.cos(anglesOffset[i]) * radius,
                Math.sin(anglesOffset[i]) * radius,
                0.0
            );
        }

        return vertices;
    }


    /**
     * Set up locations(send VBOs to GPU(shader))
    */
    setupLocation() {
        const gl = this.gl

        const positionAttributeLocation = gl.getAttribLocation(this.program, 'position')
        const colorAttributeLocation = gl.getAttribLocation(this.program, 'color')

        const vboArray = [this.positionVBO, this.colorVBO]
        const attributeLocationArray = [positionAttributeLocation, colorAttributeLocation]
        const strideArray = [this.positionStride, this.colorStride]
        WebGLUtility.enableBuffer(gl, vboArray, attributeLocationArray, strideArray)

        // Send uniform to GPU(shader)
        this.uniformLocation = {
            time: gl.getUniformLocation(this.program, 'time')
        }
    }


    /**
     * Set up for rendering
     */
    setupRendering() {
        const gl = this.gl

        // viewport(x,y,width, height)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)

        // Clear color
        gl.clearColor(0.0, 0.0, 0.3, 1.0)  // Dark blue background
        gl.clear(gl.COLOR_BUFFER_BIT)
    }

    start() {
        this.startTime = Date.now()
        this.isRendering = true
        this.render()
    }

    stop() {
        this.isRendering = false
    }


    /**
     * Render
     */
    render() {
        const gl = this.gl;

        if (this.isRendering === true) {
            requestAnimationFrame(this.render)
        }

        this.setupRendering()

        const currentTime = (Date.now() - this.startTime) * 0.001
        gl.useProgram(this.program)

        // Send uniform time value to GPU(shader)
        gl.uniform1f(this.uniformLocation.time, currentTime)

        // Draw outer circle
        gl.drawArrays(gl.TRIANGLES, 0, 64 * 3);

        // Draw inner circle
        gl.drawArrays(gl.TRIANGLES, 64 * 3, 64 * 3);

        // Draw star
        gl.drawArrays(gl.TRIANGLES, 64 * 3 * 2, 6);
    }
}