async function readShader(id) {
    const req = await fetch(document.getElementById(id).src);
    return await req.text();
}

function createShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;
        
    console.error(`Could not compile Shader ${type}`, gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertShader, fragShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) return program;

    console.error("Could not link WebGL2 Program ", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

async function main() {
    const fps = document.getElementById("fps");

    const time = {
        current_t: Date.now(),
        dts: [1 / 60],
        t: 0,

        dt: () => time.dts[0],
        update: () => {
            const new_t = Date.now();
            time.dts = [(new_t - time.current_t) / 1_000, ...time.dts].slice(0, 10);
            time.t += time.dt();
            time.current_t = new_t;

            const dt = time.dts.reduce((a, dt) => a + dt, 0) / time.dts.length;
            fps.innerHTML = `${Math.round(1 / dt, 2)}`;
        },
    };

    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) alert("Could not initialize WebGL2 Context. Please check Compatibility.");

    const vertShader = createShader(gl, gl.VERTEX_SHADER, await readShader("vert"));
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, await readShader("frag"));
    const program = createProgram(gl, vertShader, fragShader);


    const u_resolution = gl.getUniformLocation(program, "u_resolution");
    const u_time = gl.getUniformLocation(program, "u_time");
    const u_dt = gl.getUniformLocation(program, "u_dt");
    const u_mousePosition = gl.getUniformLocation(program, "u_mousePosition");  

    const posAttrLoc = gl.getAttribLocation(program, "a_pos");
    const uvAttrLoc = gl.getAttribLocation(program, "a_uv");

    const data = new Float32Array([
        -1.0, -1.0,  0.0, 0.0,
         1.0, -1.0,  1.0, 0.0,
         1.0,  1.0,  1.0, 1.0,
        -1.0,  1.0,  0.0, 1.0,
    ]);

    const indices = new Uint16Array([
        0, 1, 2,
        0, 2, 3
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posAttrLoc);
    gl.vertexAttribPointer(posAttrLoc, 2, gl.FLOAT, false, 4 * 4, 0);
    gl.enableVertexAttribArray(uvAttrLoc);
    gl.vertexAttribPointer(uvAttrLoc, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    canvas.addEventListener("mousemove", function(event) {
        var mouseX = event.offsetX / canvas.offsetWidth - 0.5;
        var mouseY = 0.5 - event.offsetY / canvas.offsetHeight ;
        gl.uniform2f(u_mousePosition, mouseX, mouseY);
    });

    function loop() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindVertexArray(vao);
        gl.useProgram(program);
        gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(u_time, time.t);
        gl.uniform1f(u_dt, time.dt());
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        time.update();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

main();
