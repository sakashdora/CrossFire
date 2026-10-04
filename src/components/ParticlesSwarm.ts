import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface ParticlesSwarmOptions {
  count?: number;
  speedMult?: number;
  cameraZ?: number;
  interactive?: boolean;
}

export class ParticlesSwarm {
  container: HTMLElement;
  count: number;
  speedMult: number;
  cameraZ: number;
  interactive: boolean;

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;

  dummy: THREE.Object3D;
  color: THREE.Color;
  target: THREE.Vector3;
  pColor: THREE.Color;

  geometry: THREE.TetrahedronGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.InstancedMesh;
  positions: THREE.Vector3[];
  startTime: number;

  private animationFrameId: number | null = null;
  private isDisposed = false;
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  constructor(container: HTMLElement, options: ParticlesSwarmOptions = {}) {
    this.container = container;
    this.count = options.count ?? 20000;
    this.speedMult = options.speedMult ?? 1;
    this.cameraZ = options.cameraZ ?? 115;
    this.interactive = options.interactive ?? true;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // SETUP
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050D1A, 0.005);
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    this.camera.position.set(0, 0, this.cameraZ);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.renderer.domElement);

    // POST PROCESSING
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.35,
      0.45,
      0.05
    );
    bloomPass.strength = 1.35;
    bloomPass.radius = 0.45;
    bloomPass.threshold = 0.05;
    this.composer.addPass(bloomPass);

    // OBJECTS
    this.dummy = new THREE.Object3D();
    this.color = new THREE.Color();
    this.target = new THREE.Vector3();
    this.pColor = new THREE.Color();

    this.geometry = new THREE.TetrahedronGeometry(0.25);
    this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);

    this.positions = [];
    for (let i = 0; i < this.count; i++) {
      this.positions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        )
      );
      this.mesh.setColorAt(i, this.color.setHex(0x00d4ff));
    }
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    this.startTime = performance.now();

    // Event listeners
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener('resize', this.onResize);
    if (this.interactive) {
      window.addEventListener('mousemove', this.onMouseMove);
    }

    this.animate = this.animate.bind(this);
    this.animate();
  }

  private onResize() {
    if (this.isDisposed || !this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.composer.setSize(width, height);
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isDisposed) return;
    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    this.targetMouseX = (e.clientX - halfW) / halfW;
    this.targetMouseY = (e.clientY - halfH) / halfH;
  }

  animate() {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const time = ((performance.now() - this.startTime) * 0.001) * this.speedMult;

    // Optional uniform support
    const mat = this.material as unknown as { uniforms?: { uTime?: { value: number } } };
    if (mat.uniforms && mat.uniforms.uTime) {
      mat.uniforms.uTime.value = time;
    }

    // Parameters
    const PARAMS = {
      radius: 107.6,
      fusion: 2.5,
      convect: 1.2,
      magnetic: 1.4,
      wind: 3.55,
      loops: 16,
    };
    const addControl = (id: keyof typeof PARAMS, _l: string, _min: number, _max: number, val: number) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
    };

    const count = this.count;

    // Hoisted outside loop for 60fps performance
    const scaleR = addControl('radius', 'Sun Radius', 40, 300, 120);
    const fusionRate = addControl('fusion', 'Fusion Rate', 0.5, 6, 2.5);
    const convection = addControl('convect', 'Convection Turbulence', 0, 3, 1.2);
    const magnetic = addControl('magnetic', 'Magnetic Activity', 0, 3, 1.4);
    const windSpeed = addControl('wind', 'Solar Wind Speed', 0, 5, 1.8);
    const loopsCount = Math.max(4, Math.floor(addControl('loops', 'Active Regions', 4, 40, 16)));

    const t0 = 0.12,
      t1 = 0.32,
      t2 = 0.55,
      t3 = 0.68,
      t4 = 0.78,
      t5 = 0.9,
      t6 = 0.97;

    const ang = time * 0.03;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);

    const target = this.target;
    const color = this.pColor;

    for (let i = 0; i < this.count; i++) {
      const t = i / Math.max(1, count);
      const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      const h2 = Math.abs(Math.sin(i * 78.233) * 12543.123) % 1;
      const h3 = Math.abs(Math.sin(i * 45.164) * 98765.432) % 1;
      const h4 = Math.abs(Math.sin(i * 33.719) * 54321.987) % 1;
      const h5 = Math.abs(Math.sin(i * 61.431) * 31415.9265) % 1;

      let px = 0,
        py = 0,
        pz = 0;

      if (t < t0) {
        const coreR = scaleR * 0.22;
        const theta = h1 * 6.2831853;
        const cphi = h2 * 2 - 1;
        const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
        const rr = Math.cbrt(Math.max(h3, 0.0001)) * coreR;
        const jitter = Math.sin(time * 3 + h4 * 6.283) * coreR * 0.03;
        const rad = rr + jitter;
        px = rad * sphi * Math.cos(theta);
        py = rad * sphi * Math.sin(theta);
        pz = rad * cphi;
        const burst = Math.pow(0.5 + 0.5 * Math.sin(time * fusionRate * 4 + h5 * 18.85), 6);
        const bright = 0.5 + 0.5 * burst;
        // Blue Flame Core: Electric cyan-blue with controlled luminance
        color.setHSL(0.52 - burst * 0.04, 0.95, Math.min(0.68, 0.38 + bright * 0.26));
      } else if (t < t1) {
        const rMin = scaleR * 0.22,
          rMax = scaleR * 0.46;
        const rr = rMin + h1 * (rMax - rMin);
        const theta = h2 * 6.2831853 + Math.sin(time * 0.03 + h3 * 6.283) * 0.3;
        const cphi = h3 * 2 - 1;
        const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
        const wander = Math.sin(time * 0.08 + h4 * 6.283) * scaleR * 0.02;
        const rad = rr + wander;
        px = rad * sphi * Math.cos(theta);
        py = rad * sphi * Math.sin(theta);
        pz = rad * cphi;
        // Deep sapphire & cobalt blue flame mantle
        color.setHSL(0.58 + h5 * 0.03, 0.92, 0.22 + h5 * 0.08);
      } else if (t < t2) {
        const rMin = scaleR * 0.46,
          rMax = scaleR * 0.72;
        const rr = rMin + h1 * (rMax - rMin);
        const theta = h2 * 6.2831853;
        const cphi = h3 * 2 - 1;
        const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
        const cell =
          Math.sin(theta * 6 + time * convection * 0.5) +
          Math.sin(cphi * 18 + time * convection * 0.4 + h4 * 6.283) +
          Math.sin((theta + cphi) * 12 - time * convection * 0.6);
        const flow = cell * convection * scaleR * 0.015;
        const rad = rr + flow;
        px = rad * sphi * Math.cos(theta + flow * 0.01);
        py = rad * sphi * Math.sin(theta + flow * 0.01);
        pz = rad * cphi;
        const heat = (cell + 3) / 6;
        // Convection blue-cyan flame cells
        color.setHSL(0.54 + (1 - heat) * 0.05, 0.95, 0.22 + heat * 0.24);
      } else if (t < t3) {
        const R = scaleR * 0.76;
        const theta = h1 * 6.2831853;
        const cphi = h2 * 2 - 1;
        const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
        const granule =
          Math.sin(theta * 24 + time * 0.6) +
          Math.sin(cphi * 30 - time * 0.5 + h3 * 6.283) +
          Math.sin(theta * 17 + cphi * 13 + time * 0.4);
        const spotNoise = Math.sin(theta * 3 + h4 * 6.283) + Math.sin(cphi * 4 + time * 0.05);
        const spotDark = Math.max(0, -spotNoise - 1.1) * 0.8;
        const rad = R + granule * scaleR * 0.004;
        px = rad * sphi * Math.cos(theta);
        py = rad * sphi * Math.sin(theta);
        pz = rad * cphi;
        const bright = 0.45 + granule * 0.1 - spotDark * 0.4;
        // Electric cerulean flame surface
        color.setHSL(0.55, 0.92, Math.max(0.12, Math.min(0.58, bright)));
      } else if (t < t4) {
        const Rbase = scaleR * 0.79;
        const theta = h1 * 6.2831853;
        const cphi = h2 * 2 - 1;
        const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
        const spiculeLen = scaleR * 0.05;
        const spicule = Math.abs(Math.sin(time * 2 + h3 * 18.85)) * spiculeLen;
        const rad = Rbase + spicule;
        px = rad * sphi * Math.cos(theta);
        py = rad * sphi * Math.sin(theta);
        pz = rad * cphi;
        const spiculeRatio = spicule / Math.max(spiculeLen, 0.0001);
        // Violet-indigo flame plasma spicules
        color.setHSL(0.67 + spiculeRatio * 0.04, 0.95, 0.28 + spiculeRatio * 0.25);
      } else if (t < t5) {
        if (h5 < 0.5) {
          const loopIndex = Math.floor(i % loopsCount);
          const lh1 = Math.abs(Math.sin(loopIndex * 17.17) * 6543.21) % 1;
          const lh2 = Math.abs(Math.sin(loopIndex * 29.71) * 7654.32) % 1;
          const lh3 = Math.abs(Math.sin(loopIndex * 53.13) * 8765.43) % 1;
          const lh4 = Math.abs(Math.sin(loopIndex * 71.91) * 9876.54) % 1;
          const pcphi = lh2 * 2 - 1;
          const psphi = Math.sqrt(Math.max(0, 1 - pcphi * pcphi));
          const pTheta = lh1 * 6.2831853;
          const pX = psphi * Math.cos(pTheta),
            pY = psphi * Math.sin(pTheta),
            pZ = pcphi;
          const refX = 0,
            refY = 1,
            refZ = 0.15;
          let e1x = refY * pZ - refZ * pY,
            e1y = refZ * pX - refX * pZ,
            e1z = refX * pY - refY * pX;
          const len1 = Math.max(Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z), 1e-5);
          e1x /= len1;
          e1y /= len1;
          e1z /= len1;
          let e2x = pY * e1z - pZ * e1y,
            e2y = pZ * e1x - pX * e1z,
            e2z = pX * e1y - pY * e1x;
          const len2 = Math.max(Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z), 1e-5);
          e2x /= len2;
          e2y /= len2;
          e2z /= len2;
          const halfWidth = 0.2 + lh3 * 0.35;
          const s = h1;
          const alpha = (s - 0.5) * halfWidth * 2;
          let dirx = e1x * Math.cos(alpha) + e2x * Math.sin(alpha);
          let diry = e1y * Math.cos(alpha) + e2y * Math.sin(alpha);
          let dirz = e1z * Math.cos(alpha) + e2z * Math.sin(alpha);
          const dlen = Math.max(Math.sqrt(dirx * dirx + diry * diry + dirz * dirz), 1e-5);
          dirx /= dlen;
          diry /= dlen;
          dirz /= dlen;
          const bulge = Math.cos((s - 0.5) * 3.14159);
          const flarePulse = 0.6 + 0.4 * Math.sin(time * 0.4 * magnetic + lh4 * 6.283);
          const archHeight = scaleR * (0.1 + lh3 * 0.15) * Math.max(0.1, magnetic) * flarePulse;
          const radius = scaleR * 0.8 + archHeight * bulge;
          px = dirx * radius;
          py = diry * radius;
          pz = dirz * radius;
          // Neon cyan magnetic arches
          color.setHSL(0.50, 0.95, 0.32 + bulge * 0.26);
        } else {
          const theta = h1 * 6.2831853;
          const cphi = h2 * 2 - 1;
          const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
          const travel = (time * windSpeed * 0.6 + h3 * 18) % 18;
          const rad = scaleR * 0.82 + travel * scaleR * 0.05;
          px = rad * sphi * Math.cos(theta);
          py = rad * sphi * Math.sin(theta);
          pz = rad * cphi;
          const fade = Math.max(0, 1 - travel / 18);
          // Azure solar wind stream
          color.setHSL(0.58, 0.85, 0.12 + fade * 0.38);
        }
      } else if (t < t6) {
        const loopIndex = Math.floor(i % loopsCount);
        const lh1 = Math.abs(Math.sin(loopIndex * 21.31) * 5432.19) % 1;
        const lh2 = Math.abs(Math.sin(loopIndex * 37.77) * 6321.98) % 1;
        const lh3 = Math.abs(Math.sin(loopIndex * 59.59) * 7219.87) % 1;
        const lh4 = Math.abs(Math.sin(loopIndex * 83.13) * 8123.65) % 1;
        const pcphi = lh2 * 2 - 1;
        const psphi = Math.sqrt(Math.max(0, 1 - pcphi * pcphi));
        const pTheta = lh1 * 6.2831853;
        const pX = psphi * Math.cos(pTheta),
          pY = psphi * Math.sin(pTheta),
          pZ = pcphi;
        const refX = 0.15,
          refY = 0,
          refZ = 1;
        let e1x = refY * pZ - refZ * pY,
          e1y = refZ * pX - refX * pZ,
          e1z = refX * pY - refY * pX;
        const len1 = Math.max(Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z), 1e-5);
        e1x /= len1;
        e1y /= len1;
        e1z /= len1;
        let e2x = pY * e1z - pZ * e1y,
          e2y = pZ * e1x - pX * e1z,
          e2z = pX * e1y - pY * e1x;
        const len2 = Math.max(Math.sqrt(e2x * e2x + e2y * e2y + e2z * e2z), 1e-5);
        e2x /= len2;
        e2y /= len2;
        e2z /= len2;
        const halfWidth = 0.3 + lh3 * 0.5;
        const s = h1;
        const alpha = (s - 0.5) * halfWidth * 2;
        let dirx = e1x * Math.cos(alpha) + e2x * Math.sin(alpha);
        let diry = e1y * Math.cos(alpha) + e2y * Math.sin(alpha);
        let dirz = e1z * Math.cos(alpha) + e2z * Math.sin(alpha);
        const dlen = Math.max(Math.sqrt(dirx * dirx + diry * diry + dirz * dirz), 1e-5);
        dirx /= dlen;
        diry /= dlen;
        dirz /= dlen;
        const bulge = Math.cos((s - 0.5) * 3.14159);
        const flarePulse = 0.5 + 0.5 * Math.sin(time * 0.5 * magnetic + lh4 * 6.283);
        const archHeight = scaleR * (0.2 + lh3 * 0.3) * Math.max(0.1, magnetic) * flarePulse;
        const radius = scaleR * 0.79 + archHeight * bulge;
        px = dirx * radius;
        py = diry * radius;
        pz = dirz * radius;
        // Electric blue prominence eruption
        color.setHSL(0.52 + flarePulse * 0.04, 0.95, 0.32 + flarePulse * 0.26 + bulge * 0.08);
      } else {
        const theta = h1 * 6.2831853;
        const cphi = h2 * 2 - 1;
        const sphi = Math.sqrt(Math.max(0, 1 - cphi * cphi));
        const travel = (time * windSpeed * 1.1 + h3 * 70) % 70;
        const rad = scaleR * 0.95 + travel * scaleR * 0.045;
        px = rad * sphi * Math.cos(theta);
        py = rad * sphi * Math.sin(theta);
        pz = rad * cphi;
        const fade = Math.max(0, 1 - travel / 70);
        // Deep space cosmic particle trails
        color.setHSL(0.60, 0.75, 0.08 + fade * 0.26);
      }

      const fx = px * ca - py * sa;
      const fy = px * sa + py * ca;
      target.set(fx, fy, pz);

      // UPDATE
      this.positions[i].lerp(target, 0.1);
      this.dummy.position.copy(this.positions[i]);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }

    // Smooth subtle camera parallax
    if (this.interactive) {
      this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
      this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
      this.camera.position.x = this.mouseX * 18;
      this.camera.position.y = -this.mouseY * 18;
      this.camera.lookAt(0, 0, 0);
    }

    this.composer.render();
  }

  dispose() {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.onResize);
    if (this.interactive) {
      window.removeEventListener('mousemove', this.onMouseMove);
    }

    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.mesh);

    if (this.composer) {
      this.composer.dispose?.();
    }
    this.renderer.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
