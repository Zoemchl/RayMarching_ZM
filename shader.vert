#version 300 es
precision highp float;

layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_uv;

out vec2 f_uv;

void main() {
    gl_Position = vec4(a_pos, 0.0, 1);
    f_uv = a_uv;
}