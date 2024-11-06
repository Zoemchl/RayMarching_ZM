#version 300 es
precision highp float;

#define EPS         0.001
#define N_MAX_STEPS 80
#define MAX_DIST    100.0

uniform vec2 u_resolution;
uniform float u_time;

uniform vec2 u_mousePosition;

uniform float u_dt;

in vec2 f_uv;

out vec4 out_color;

vec3 get_mouse_position(vec2 mouseUV) {

    float x = (mouseUV.x) * 2.0;
    float y = (mouseUV.y) * 20.0;
    return vec3(x, y, 0.0);
}

float smin(float a, float b, float k) {
    k *= log(2.0);
    float x = b - a;
    return a + x / (1.0 - exp2(x / k));
}

float sdp_sphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBoxFrame( vec3 p, vec3 b, float e )
{
    p = abs(p) - b;
    vec3 q = abs(p + e) - e;
    return min(min(
        length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
        length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
        length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}

float sdPlane(vec3 p, vec3 n, float h) {
    return dot(p, n) + h;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdCutHollowSphere( vec3 p, float r, float h, float t )
{
  float w = sqrt(r*r-h*h);
  
  vec2 q = vec2( length(p.xz), p.y );
  return ((h*q.x<w*q.y) ? length(q-vec2(w,h)) : 
                          abs(length(q)-r) ) - t;
}

float sdf_scene(vec3 p) {
    vec3 currentMouse = get_mouse_position(u_mousePosition);
    vec3 sphereOrigin = vec3(0.0, 8.5, 0.0);

    float bf = sdBoxFrame(p, vec3(5.0, 15.0, 5.0), 0.1);
    float sp1 = sdp_sphere(p - (currentMouse + sphereOrigin), 1.5);
    float ground = sdPlane(p, vec3(0.0, 1.0, 0.0), 0.0);
    float hs2 = sdCutHollowSphere(p - vec3(0.0, 2.0, 0.0), 0.0, 0.0, 3.0);
    float hs3 = sdCutHollowSphere(p - vec3(0.0, 15.0, 0.0), 3.0, 0.0, 0.0);
    float box1 = sdBox(p - vec3(0.0, 3.0, 0.0), vec3(5.0, 1.0, 5.0));
    float box2 = sdBox(p - vec3(0.0, 15.0, 0.0), vec3(5.0, 1.0, 5.0));

    float sceneElements = min(bf, ground);
    sceneElements = min(sceneElements, min(box1, box2));

    float combinedHSBox1 = smin(hs2, box1, 0.5);
    float combinedHSBox2 = smin(hs3, box2, 0.5);
    float combinedHS = smin(sp1, min(hs2, hs3), 0.8);

    return min(sceneElements, min(combinedHSBox1, min(combinedHSBox2, combinedHS)));
}


float ray_march(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < N_MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = sdf_scene(p);
        t += d;
        if (d < EPS || t > MAX_DIST) break;
    }
    return t;
}

vec3 approx_normal(vec3 p) {
    vec2 eps = vec2(EPS, -EPS);
    return normalize(
        eps.xyy * sdf_scene(p + eps.xyy) + 
        eps.yyx * sdf_scene(p + eps.yyx) + 
        eps.yxy * sdf_scene(p + eps.yxy) + 
        eps.xxx * sdf_scene(p + eps.xxx)
    );
}

void main() {
    vec2 uv = (f_uv * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);
    vec3 ro = vec3(0.0, 10.0, -10.0);
    vec3 rd = normalize(vec3(uv, 0.8));

    vec3 a_col = vec3(185.0 / 255.0, 210.0 / 255.0, 250.0 / 255.0);
    vec3 col = a_col;

    vec3 l_dir = normalize(vec3(sin(u_time), 0.0, cos(u_time)));
    vec3 l_col = vec3(0.8, 0.6, 0.4);

    float t = ray_march(ro, rd);
    if (t < MAX_DIST) {
        vec3 p = ro + rd * t;

        vec3 n = approx_normal(p);
        vec3 diff = vec3(max(0.0, dot(l_dir, n))) * l_col;

        float k = max(0.0, dot(n, -rd));
        vec3 ref = vec3(pow(k, 4.0)) * 1.0 * l_col;

        col = mix(diff + ref, a_col, 0.1);
    }

    col = pow(col, vec3(0.4545));
    out_color = vec4(col, 1.0);
}
