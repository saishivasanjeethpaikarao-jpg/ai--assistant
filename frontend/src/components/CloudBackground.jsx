import { useRef, useEffect } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2  uRes;
uniform float uTime;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash13(i),            hash13(i+vec3(1,0,0)),f.x),
        mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),
        mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);
}

float fbm(vec3 p) {
  float v=0.0, w=0.5;
  for(int i=0;i<6;i++){
    v += w*noise(p);
    p  = p*2.01 + vec3(0.0, 0.02*uTime, 0.01*uTime);
    w *= 0.5;
  }
  return v;
}

vec4 sampleCloud(vec3 p) {
  vec3 wind = vec3(uTime*0.04, 0.0, uTime*0.025);
  float d = fbm(p*0.45 + wind);
  d = smoothstep(0.47, 0.80, d);
  if(d < 0.01) return vec4(0.0);

  // Color: mix lavender, rose, violet
  vec3 base = mix(
    vec3(0.94, 0.82, 1.00),
    vec3(1.00, 0.78, 0.88),
    noise(p*0.9 + wind*0.5)
  );
  base = mix(base, vec3(0.75, 0.60, 0.95), noise(p*1.4)*0.4);

  // Self-shadow (darker underneath)
  float shadow = fbm(p*0.45 + wind + vec3(0.0, 0.6, 0.0));
  float shade  = 1.0 - smoothstep(0.3, 0.75, shadow)*0.55;
  base *= shade;

  // Backlit rim (warm pink)
  vec3 litDir = normalize(vec3(0.5,1.0,0.8));
  float rim = max(0.0, dot(normalize(p), litDir));
  base += vec3(0.6,0.2,0.5)*pow(rim,3.0)*0.25;

  return vec4(base, d*0.98);
}

void main() {
  vec2 uv = (2.0*gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);

  // Camera slow-drift
  vec3 ro = vec3(0.0, 1.3, -1.5 + uTime*0.004);
  vec3 rd = normalize(vec3(uv.x*0.85, uv.y*0.85 + 0.15, 1.0));

  // Sky: deep indigo → purple horizon
  float h     = clamp(rd.y*0.5+0.5, 0.0, 1.0);
  vec3  sky   = mix(vec3(0.55,0.25,0.80), vec3(0.04,0.02,0.14), pow(h,0.7));

  // Sun glow (soft pink-violet)
  vec3  lDir  = normalize(vec3(0.35,0.55,0.85));
  float sun   = max(0.0, dot(rd, lDir));
  sky += vec3(0.9,0.35,0.70)*pow(sun,5.0)*0.50;
  sky += vec3(0.5,0.15,0.65)*pow(sun,1.5)*0.12;

  // Stars (tiny points)
  float ss = hash13(floor(rd*220.0));
  if(ss > 0.9975 && rd.y > 0.05)
    sky += vec3(0.9,0.85,1.0)*((ss-0.9975)/0.0025)*0.7;

  // Ray-march cloud slab y:[0.5, 3.5]
  vec3  col  = sky;
  float trns = 1.0;

  float tA = (0.5 - ro.y) / rd.y;
  float tB = (3.5 - ro.y) / rd.y;
  if(tA > tB){ float tmp=tA; tA=tB; tB=tmp; }
  tA = max(0.05, tA); tB = min(14.0, tB);

  if(tA < tB) {
    float dt = (tB-tA) / 56.0;
    float t  = tA + hash13(vec3(uv*80.0, uTime*0.3))*dt; // jitter

    for(int i=0; i<56; i++){
      if(t > tB || trns < 0.015) break;
      vec3 p = ro + rd*t;
      vec4 c = sampleCloud(p);
      if(c.a > 0.001){
        col  = mix(col, c.rgb, c.a*trns);
        trns *= 1.0 - c.a*0.82;
      }
      t += dt;
    }
  }

  // Vignette
  float vig = 1.0 - dot(uv*0.38, uv*0.38);
  col = col * (0.78 + 0.22*vig);

  // Subtle film grain
  float grain = (hash13(vec3(gl_FragCoord.xy, uTime*30.0))-0.5)*0.025;
  col += grain;

  gl_FragColor = vec4(clamp(col,0.0,1.0), 1.0);
}
`;

function initGL(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1, 3]), gl.STATIC_DRAW);

  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    uRes:  gl.getUniformLocation(prog, 'uRes'),
    uTime: gl.getUniformLocation(prog, 'uTime'),
  };
}

const CloudBackground = () => {
  const canvasRef = useRef(null);
  const ctxRef    = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = initGL(canvas);
    if (!ctx) {
      // WebGL not available — fallback gradient handled by CSS
      return;
    }
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      // Render at half resolution for performance, then scale up via CSS
      canvas.width  = Math.floor(window.innerWidth  * dpr * 0.5);
      canvas.height = Math.floor(window.innerHeight * dpr * 0.5);
      ctx.gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    const render = () => {
      const t = (performance.now() - start) / 1000;
      const { gl, uRes, uTime } = ctx;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 0, display: 'block',
        // CSS upscale — slightly blurry is fine and adds dreaminess
        imageRendering: 'auto',
      }}
    />
  );
};

export default CloudBackground;
