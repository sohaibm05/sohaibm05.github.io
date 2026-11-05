/* =====================================================================
   3D SCENE — ink-wash spires in mist, a crimson dragon that follows you
   down the page, drifting ink flecks. Three.js r149 (classic build).
   ===================================================================== */
(function () {
  const canvas = document.getElementById("scene");
  if (!canvas || typeof THREE === "undefined") {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    document.documentElement.classList.add("no-webgl");
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.innerWidth < 760;

  const PAPER = new THREE.Color("#e8e2d6");
  const INK = new THREE.Color("#141210");
  const INK_SOFT = new THREE.Color("#4a4540");
  const CRIMSON = new THREE.Color("#c4161c");
  const CRIMSON_DEEP = new THREE.Color("#6e0b0e");

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.setClearColor(PAPER, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAPER, 16, 52);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
  camera.position.set(0, 0, 20);

  const SCROLL_DEPTH = 64; // world units the camera descends over the full page

  /* ---------- shared GLSL ---------- */
  const NOISE = `
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
      return v;
    }
  `;

  // The dragon's spine is an analytic path. Body point s (0 tail → 1 head)
  // sits where the head was a moment ago, so the body follows the head.
  const SPINE = `
    uniform float uTime;
    uniform vec3 uOffset;
    vec3 spine(float s){
      float a = s*5.2 - uTime*0.55;
      vec3 p;
      p.x = sin(a*0.9)*7.5 + sin(a*0.37 + 1.3)*3.2;
      p.y = sin(a*0.62 + 0.7)*3.4 + cos(a*1.31)*0.9;
      p.z = cos(a*0.74)*4.5 - 3.0;
      return p + uOffset;
    }
  `;

  /* ---------- ink spires ---------- */
  const spireMat = new THREE.ShaderMaterial({
    uniforms: {
      uInk: { value: INK },
      uInkLight: { value: INK_SOFT },
      uPaper: { value: PAPER },
      uFogNear: { value: 14 },
      uFogFar: { value: 50 },
    },
    vertexShader: `
      attribute float aH;
      varying vec3 vN; varying vec3 vW; varying float vH;
      void main(){
        vec4 w = modelMatrix * vec4(position,1.0);
        vW = w.xyz; vH = aH;
        vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 uInk, uInkLight, uPaper; uniform float uFogNear, uFogFar;
      varying vec3 vN; varying vec3 vW; varying float vH;
      ${NOISE}
      void main(){
        vec3 n = normalize(vN);
        float l = dot(n, normalize(vec3(-0.65, 0.75, 0.45)))*0.5 + 0.5;
        float tone = l < 0.38 ? 0.0 : (l < 0.68 ? 0.45 : 0.85);
        float streak = fbm(vec2(vW.x*0.9 + vW.z*0.6, vW.y*0.18));
        vec3 col = mix(uInk, uInkLight, clamp(tone*0.7 + (streak-0.5)*0.6, 0.0, 1.0));
        // dry-brush flecks of paper showing through
        float dry = smoothstep(0.72, 0.8, fbm(vec2(vW.y*1.6, vW.x*3.0 + vW.z*3.0)));
        col = mix(col, uPaper, dry*0.35*tone);
        // mist swallowing the base
        float mist = 1.0 - smoothstep(0.02, 0.6, vH);
        col = mix(col, uPaper, mist*0.92);
        float d = length(vW - cameraPosition);
        col = mix(col, uPaper, smoothstep(uFogNear, uFogFar, d));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });

  const bushMat = new THREE.MeshBasicMaterial({ color: INK, fog: true });

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeSpire(height, radius, seed) {
    let g = new THREE.CylinderGeometry(radius * 0.55, radius, height, 11, 18, false);
    const pos = g.attributes.position;
    const hAttr = new Float32Array(pos.count);
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const h = v.y / height + 0.5;
      const ang = Math.atan2(v.z, v.x);
      const ledge = 1 + 0.14 * Math.max(0, Math.sin(h * 11 + seed));
      const r =
        (1 + 0.22 * Math.sin(ang * 3 + h * 4 + seed) + 0.12 * Math.sin(ang * 7 - h * 9 + seed * 2)) * ledge;
      v.x *= r; v.z *= r;
      v.x += Math.sin(h * 3 + seed) * radius * 0.35;
      pos.setXYZ(i, v.x, v.y, v.z);
      hAttr[i] = h;
    }
    g.setAttribute("aH", new THREE.BufferAttribute(hAttr, 1));
    g = g.toNonIndexed();
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, spireMat);

    // pine silhouettes on top, sumi-e style
    const group = new THREE.Group();
    group.add(mesh);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.5, 1.1) * radius * 0.6, 0), bushMat);
      b.scale.set(1.6, 0.45, 1.2);
      b.position.set(rand(-0.4, 0.4) * radius, height / 2 + rand(0.0, 0.5), rand(-0.4, 0.4) * radius);
      b.rotation.y = Math.random() * 3;
      group.add(b);
    }
    return group;
  }

  const spires = [];
  const spireCount = small ? 16 : 26;
  for (let i = 0; i < spireCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const fg = i % 7 === 0; // a few big foreground spires frame the view
    const h = fg ? rand(18, 26) : rand(9, 22);
    const r = fg ? rand(2.0, 2.8) : rand(0.9, 2.0);
    const s = makeSpire(h, r, Math.random() * 10);
    const x = side * (fg ? rand(9, 13) : rand(5.5, 16));
    const z = fg ? rand(3, 6) : rand(-28, -3);
    const y = 4 - (i / spireCount) * (SCROLL_DEPTH + 10) + rand(-4, 4) - h * 0.15;
    s.position.set(x, y, z);
    s.rotation.y = Math.random() * Math.PI;
    scene.add(s);
    spires.push(s);
  }

  /* ---------- crimson sun ---------- */
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uCol: { value: CRIMSON }, uPaper: { value: PAPER }, uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uCol, uPaper; uniform float uTime; varying vec2 vUv;
        ${NOISE}
        void main(){
          vec2 p = vUv - 0.5;
          float r = length(p);
          float edge = 0.36 + (fbm(vec2(atan(p.y,p.x)*3.0, uTime*0.05))-0.5)*0.04;
          float a = 1.0 - smoothstep(edge-0.01, edge+0.012, r);
          float wash = fbm(vUv*5.0 + uTime*0.02);
          vec3 col = mix(uCol, uPaper, 0.22 + wash*0.25);
          gl_FragColor = vec4(col, a*0.92);
        }`,
    })
  );
  sun.position.set(7, 6, -34);
  scene.add(sun);

  /* ---------- mist banks ---------- */
  const mistMat = (seed) =>
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPaper: { value: PAPER }, uSeed: { value: seed } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime, uSeed; uniform vec3 uPaper; varying vec2 vUv;
        ${NOISE}
        void main(){
          vec2 q = vUv*vec2(4.0,1.6) + vec2(uTime*0.025 + uSeed, uSeed*0.3);
          float n = fbm(q + fbm(q*1.7 - uTime*0.01));
          float band = smoothstep(0.0, 0.45, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
          float side = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
          float a = smoothstep(0.35, 0.75, n) * band * side;
          gl_FragColor = vec4(uPaper, a*0.85);
        }`,
    });
  const mists = [];
  const mistCount = small ? 7 : 11;
  for (let i = 0; i < mistCount; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 16), mistMat(Math.random() * 20));
    m.position.set(rand(-6, 6), 2 - (i / mistCount) * (SCROLL_DEPTH + 6), rand(-22, 2));
    scene.add(m);
    mists.push(m);
  }

  /* ---------- the dragon ---------- */
  const dragonUniforms = {
    uTime: { value: 0 },
    uOffset: { value: new THREE.Vector3() },
    uCrimson: { value: CRIMSON },
    uDeep: { value: CRIMSON_DEEP },
    uInk: { value: INK_SOFT },
    uPaper: { value: PAPER },
  };

  const bodyGeo = new THREE.CylinderGeometry(1, 1, 1, 14, small ? 160 : 260, true);
  const dragon = new THREE.Mesh(
    bodyGeo,
    new THREE.ShaderMaterial({
      uniforms: dragonUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        ${SPINE}
        varying float vS; varying float vAng; varying vec3 vN; varying vec3 vW;
        float radius(float s){
          float body = 0.1 + 0.62*smoothstep(0.0, 0.6, s);
          float neck = 1.0 - 0.28*smoothstep(0.78, 0.86, s)*(1.0-smoothstep(0.86,0.9,s));
          float head = 1.0 + 0.35*smoothstep(0.86, 0.93, s) - 0.85*smoothstep(0.95, 1.0, s);
          float scales = 1.0 + 0.09*sin(s*140.0 - uTime*3.0);
          return body*neck*head*scales;
        }
        void main(){
          float s = position.y + 0.5;
          float ang = atan(position.z, position.x);
          float e = 0.004;
          vec3 c = spine(s);
          vec3 T = normalize(spine(s+e) - spine(s-e));
          vec3 up = abs(T.y) > 0.95 ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0);
          vec3 N = normalize(cross(T, up));
          vec3 B = cross(T, N);
          vec3 dir = cos(ang)*N + sin(ang)*B;
          vec3 p = c + dir*radius(s);
          vS = s; vAng = ang; vN = dir; vW = p;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uCrimson, uDeep, uInk, uPaper;
        varying float vS; varying float vAng; varying vec3 vN; varying vec3 vW;
        ${NOISE}
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float facing = abs(dot(normalize(vN), V));
          float rim = 1.0 - facing;
          float strokes = fbm(vec2(vS*38.0 - uTime*0.4, vAng*1.6));
          float wisps = fbm(vec2(vS*9.0 + uTime*0.15, vAng*0.8 + vS*4.0));
          vec3 col = mix(uDeep, uCrimson, smoothstep(0.15, 0.85, facing + (strokes-0.5)*0.8));
          // smoky grey-black core streaks, as in sumi-e washes
          col = mix(col, uInk, smoothstep(0.62, 0.8, wisps)*0.55);
          // dorsal ridge darker
          col = mix(col, uDeep*0.6, smoothstep(0.75, 1.0, sin(vAng))*0.5);
          float alpha = 1.0 - smoothstep(0.45, 0.98, rim + (strokes-0.5)*0.7);
          alpha *= smoothstep(0.0, 0.3, vS);           // tail dissolves
          alpha *= 0.55 + 0.45*smoothstep(0.2, 0.7, strokes + vS*0.3);
          float d = length(vW - cameraPosition);
          col = mix(col, uPaper, smoothstep(26.0, 60.0, d));
          gl_FragColor = vec4(col, alpha);
        }`,
    })
  );
  dragon.frustumCulled = false;
  scene.add(dragon);

  // red smoke shed along the body
  const SMOKE = small ? 700 : 1400;
  const smokeGeo = new THREE.BufferGeometry();
  const sArr = new Float32Array(SMOKE), seedArr = new Float32Array(SMOKE * 3);
  for (let i = 0; i < SMOKE; i++) {
    sArr[i] = Math.pow(Math.random(), 0.7);
    seedArr[i * 3] = Math.random() * 2 - 1;
    seedArr[i * 3 + 1] = Math.random();
    seedArr[i * 3 + 2] = Math.random() * 2 - 1;
  }
  smokeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SMOKE * 3), 3));
  smokeGeo.setAttribute("aS", new THREE.BufferAttribute(sArr, 1));
  smokeGeo.setAttribute("aSeed", new THREE.BufferAttribute(seedArr, 3));
  const smoke = new THREE.Points(
    smokeGeo,
    new THREE.ShaderMaterial({
      uniforms: Object.assign({ uPR: { value: renderer.getPixelRatio() } }, dragonUniforms),
      transparent: true,
      depthWrite: false,
      vertexShader: `
        ${SPINE}
        uniform float uPR;
        attribute float aS; attribute vec3 aSeed;
        varying float vLife; varying float vS;
        void main(){
          float life = fract(uTime*0.18 + aSeed.y);
          vec3 c = spine(aS);
          vec3 drift = vec3(aSeed.x, 0.6 + abs(aSeed.z)*0.6, aSeed.z) * life * (1.4 + aS*1.8);
          vec3 p = c + drift + vec3(-life*1.2, 0.0, 0.0);
          vLife = life; vS = aS;
          vec4 mv = viewMatrix * vec4(p,1.0);
          gl_PointSize = (40.0 + life*120.0) * (0.4 + aS*0.8) * uPR / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uCrimson, uInk;
        varying float vLife; varying float vS;
        void main(){
          vec2 p = gl_PointCoord - 0.5;
          float d = length(p);
          float a = smoothstep(0.5, 0.0, d);
          a *= (1.0 - vLife) * smoothstep(0.0, 0.08, vLife) * 0.35 * smoothstep(0.05, 0.35, vS);
          vec3 col = mix(uCrimson, uInk, vLife*0.45);
          gl_FragColor = vec4(col, a);
        }`,
    })
  );
  smoke.frustumCulled = false;
  scene.add(smoke);

  /* ---------- whiskers + horns (CPU mirror of the GLSL spine) ---------- */
  const offset = dragonUniforms.uOffset.value;
  function spineJS(s, time, out) {
    const a = s * 5.2 - time * 0.55;
    out.set(
      Math.sin(a * 0.9) * 7.5 + Math.sin(a * 0.37 + 1.3) * 3.2,
      Math.sin(a * 0.62 + 0.7) * 3.4 + Math.cos(a * 1.31) * 0.9,
      Math.cos(a * 0.74) * 4.5 - 3.0
    );
    return out.add(offset);
  }
  const STRANDS = [
    { side: 1, kind: "whisker" }, { side: -1, kind: "whisker" },
    { side: 1, kind: "horn" }, { side: -1, kind: "horn" },
  ];
  const strandMat = new THREE.LineBasicMaterial({ color: CRIMSON, transparent: true, opacity: 0.85 });
  const strandMatDark = new THREE.LineBasicMaterial({ color: CRIMSON_DEEP, transparent: true, opacity: 0.9 });
  const strands = STRANDS.map((d) => {
    const n = d.kind === "whisker" ? 48 : 14;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const line = new THREE.Line(g, d.kind === "whisker" ? strandMat : strandMatDark);
    line.frustumCulled = false;
    scene.add(line);
    return Object.assign({ line, n }, d);
  });
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);
  function updateStrands(time) {
    spineJS(0.995, time, _a); spineJS(0.985, time, _b);
    _T.subVectors(_a, _b).normalize();
    _N.crossVectors(_T, _UP).normalize();
    _B.crossVectors(_T, _N);
    for (const st of strands) {
      const arr = st.line.geometry.attributes.position.array;
      for (let k = 0; k < st.n; k++) {
        const u = k / (st.n - 1);
        if (st.kind === "whisker") {
          spineJS(0.995 - u * 0.2, time, _c);
          _c.addScaledVector(_N, st.side * (0.25 + u * 2.4))
            .addScaledVector(_B, Math.sin(u * 7 + time * 2.2 + st.side) * 0.6 * u - 0.15)
            .addScaledVector(_T, 0.6 * (1 - u));
        } else {
          spineJS(0.965 - u * 0.05, time, _c);
          _c.addScaledVector(_B, 0.45 + u * 1.5)
            .addScaledVector(_N, st.side * (0.25 + u * 0.55))
            .addScaledVector(_T, -u * 0.9);
        }
        arr[k * 3] = _c.x; arr[k * 3 + 1] = _c.y; arr[k * 3 + 2] = _c.z;
      }
      st.line.geometry.attributes.position.needsUpdate = true;
    }
  }

  /* ---------- ink flecks in the wind ---------- */
  const FLECKS = small ? 500 : 1100;
  const fGeo = new THREE.BufferGeometry();
  const fPos = new Float32Array(FLECKS * 3), fSize = new Float32Array(FLECKS);
  for (let i = 0; i < FLECKS; i++) {
    fPos[i * 3] = rand(-20, 20);
    fPos[i * 3 + 1] = rand(-14, 14);
    fPos[i * 3 + 2] = rand(-20, 12);
    fSize[i] = Math.random() < 0.06 ? rand(3, 6) : rand(0.8, 2.2);
  }
  fGeo.setAttribute("position", new THREE.BufferAttribute(fPos, 3));
  fGeo.setAttribute("aSize", new THREE.BufferAttribute(fSize, 1));
  const flecksUniforms = {
    uTime: { value: 0 },
    uCamY: { value: 0 },
    uInk: { value: INK },
    uRed: { value: CRIMSON },
    uPR: { value: renderer.getPixelRatio() },
  };
  const flecks = new THREE.Points(
    fGeo,
    new THREE.ShaderMaterial({
      uniforms: flecksUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform float uTime, uCamY, uPR; attribute float aSize; varying float vRed; varying float vFade;
        void main(){
          vec3 p = position;
          p.x = mod(p.x + uTime*1.6 + 20.0, 40.0) - 20.0;
          p.y = mod(p.y - uTime*0.5 - uCamY + 14.0 + sin(uTime*0.6 + position.x)*0.5, 28.0) - 14.0 + uCamY;
          vRed = step(4.5, aSize);
          vec4 mv = viewMatrix * vec4(p,1.0);
          vFade = smoothstep(2.0, 6.0, -mv.z);
          gl_PointSize = aSize * 16.0 * uPR / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uInk, uRed; varying float vRed; varying float vFade;
        void main(){
          vec2 p = gl_PointCoord - 0.5;
          // slightly squashed, torn-looking fleck
          float d = length(p*vec2(1.0, 1.6));
          float a = smoothstep(0.5, 0.3, d) * 0.75 * vFade;
          gl_FragColor = vec4(mix(uInk, uRed, vRed*0.85), a);
        }`,
    })
  );
  flecks.frustumCulled = false;
  scene.add(flecks);

  /* ---------- interaction ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollP = 0;
  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollP = max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener("scroll", readScroll, { passive: true });

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull back a little on tall/narrow screens so the dragon fits
    camera.fov = w / h < 0.8 ? 58 : 42;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();
  readScroll();

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  let t = 0, camY = 0, dragonY = 0;
  const speed = reduced ? 0.25 : 1;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt * speed;

    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    const targetY = -scrollP * SCROLL_DEPTH;
    camY += (targetY - camY) * 0.07;
    dragonY += (camY - dragonY) * 0.025; // dragon lags behind, then catches up

    camera.position.x = mouse.x * 1.6;
    camera.position.y = camY - mouse.y * 0.8;
    camera.lookAt(mouse.x * 0.4, camY - 0.6, 0);

    dragonUniforms.uTime.value = t;
    dragonUniforms.uOffset.value.set(mouse.x * 2.0 + (small ? 0 : 2.5), dragonY + 0.5, 0);
    updateStrands(t);
    flecksUniforms.uTime.value = t;
    flecksUniforms.uCamY.value = camY;
    sun.material.uniforms.uTime.value = t;
    for (const m of mists) m.material.uniforms.uTime.value = t;

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.documentElement.classList.add("webgl-ready");
})();
