import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class ParticlesSwarm {
    count: number;
    container: HTMLElement;
    speedMult: number;

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
    private startTime = performance.now();
    private isVisible = true;
    private observer: IntersectionObserver | null = null;

    private animationFrameId: number | null = null;
    private isDisposed = false;
    private handleResize: () => void;
    private handleMouseMove: (e: MouseEvent) => void;
    private mouseX: number = 0;
    private mouseY: number = 0;
    private targetMouseX: number = 0;
    private targetMouseY: number = 0;

    constructor(container: HTMLElement, count = 4500) {
        this.count = count;
        this.container = container;
        this.speedMult = 1;

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        
        // SETUP
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000d1a, 0.005);
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 100);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            powerPreference: "high-performance",
            alpha: true 
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.pointerEvents = 'none';
        this.container.appendChild(this.renderer.domElement);

        // POST PROCESSING - Soft, luxurious blue fire bloom
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.95, 0.32, 0.12);
        bloomPass.strength = 0.95; 
        bloomPass.radius = 0.32; 
        bloomPass.threshold = 0.12;
        this.composer.addPass(bloomPass);

        // OBJECTS
        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.target = new THREE.Vector3();
        this.pColor = new THREE.Color();
        
        this.geometry = new THREE.TetrahedronGeometry(0.22);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);
        
        this.positions = [];
        const aspectInit = width / height;
        const initHalfW = aspectInit >= 1.0 ? 56 : 28;
        for(let i = 0; i < this.count; i++) {
            const ang = Math.random() * Math.PI * 2;
            const r = initHalfW * 1.1 + Math.random() * 80;
            this.positions.push(new THREE.Vector3(
                r * Math.cos(ang),
                r * 0.6 * Math.sin(ang),
                (Math.random() - 0.5) * 60
            ));
            this.mesh.setColorAt(i, this.color.setHex(0x00d8ff));
        }

        this.handleResize = () => {
            if (this.isDisposed || !this.container) return;
            const w = this.container.clientWidth || window.innerWidth;
            const h = this.container.clientHeight || window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
            this.composer.setSize(w, h);
        };
        window.addEventListener('resize', this.handleResize);

        // Gentle interactive mouse parallax tracking
        this.handleMouseMove = (e: MouseEvent) => {
            if (this.isDisposed) return;
            this.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });

        // Viewport intersection observer: pauses rendering when scrolled out of view to eliminate scroll lag!
        if (typeof IntersectionObserver !== 'undefined') {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    this.isVisible = entry.isIntersecting;
                    if (this.isVisible && !this.animationFrameId && !this.isDisposed) {
                        this.animate();
                    }
                });
            }, { threshold: 0.01 });
            this.observer.observe(this.container);
        }

        this.animate = this.animate.bind(this);
        this.animate();
    }

    animate() {
        if (this.isDisposed) return;
        
        // If hero section is scrolled out of viewport, stop WebGL execution to save 100% GPU
        if (!this.isVisible) {
            this.animationFrameId = null;
            return;
        }

        this.animationFrameId = requestAnimationFrame(this.animate);
        
        // Gentle, cinematic time progression for optimal reading and calm atmosphere
        const time = ((performance.now() - this.startTime) * 0.001) * (0.65 * this.speedMult);
        
        if ((this.material as any).uniforms && (this.material as any).uniforms.uTime) {
            (this.material as any).uniforms.uTime.value = time;
        }

        // Camera silky parallax response
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;
        this.camera.position.x = this.mouseX * 6;
        this.camera.position.y = -this.mouseY * 4;
        this.camera.lookAt(0, 0, 0);

        const count = this.count;
        const scaleR = 120;
        const fusionRate = 1.8;
        const convection = 1.0;
        const magnetic = 1.2;
        const windSpeed = 1.5;
        const loopsCount = 14;

        // Viewport-adaptive central text exclusion dimensions
        const aspect = this.camera.aspect || 1.77;
        const halfW = aspect >= 1.0 ? 56 : 28;
        const halfH = aspect >= 1.0 ? 28 : 44;

        for(let i = 0; i < this.count; i++) {
            const color = this.pColor;
            const t = i / Math.max(1, count);
            
            // Pseudo-random deterministic noise hash per particle
            const h1 = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
            const h2 = Math.abs(Math.sin(i * 78.2330) * 12543.1230) % 1;
            const h3 = Math.abs(Math.sin(i * 45.1640) * 98765.4320) % 1;
            const h4 = Math.abs(Math.sin(i * 33.7190) * 54321.9870) % 1;
            const h5 = Math.abs(Math.sin(i * 61.4310) * 31415.9265) % 1;
            
            let px = 0, py = 0, pz = 0;
            
            // ─── REFINED BLUE FIRE EMBER STRATA (BALANCED PERIMETER FLOW) ───
            if (t < 0.18) {
                // 1. Inner Electric Blue Fire Halo (gentle framing boundary)
                const minR = halfW * 1.08;
                const maxR = halfW * 1.55;
                const theta = h1 * 6.2831853 + time * 0.28;
                const rr = minR + Math.cbrt(Math.max(h3, 0.001)) * (maxR - minR);
                const flameJitter = Math.sin(time * 1.8 + h4 * 6.283) * 2.2;
                const rad = rr + flameJitter;
                px = rad * Math.cos(theta);
                py = rad * (halfH / halfW) * Math.sin(theta);
                pz = (h2 * 2 - 1) * 32 + Math.sin(time * 1.4 + h5 * 6.283) * 5;
                
                const burst = Math.pow(0.5 + 0.5 * Math.sin(time * fusionRate * 2.0 + h5 * 18.85), 5);
                color.setHSL(0.52 + burst * 0.04, 1.0, 0.60 + burst * 0.35); // White-hot electric cyan
            } else if (t < 0.42) {
                // 2. Swirling Azure Plasma Stream (serene cosmic orbit)
                const rMin = halfW * 1.30, rMax = scaleR * 0.78;
                const rr = rMin + h1 * (rMax - rMin);
                const theta = h2 * 6.2831853 + time * 0.22 + Math.sin(time * 0.6 + h3 * 6.283) * 0.25;
                const wander = Math.sin(time * 0.8 + h4 * 6.283) * 3.0;
                const rad = rr + wander;
                px = rad * Math.cos(theta);
                py = rad * (halfH / halfW) * Math.sin(theta);
                pz = (h3 * 2 - 1) * 45 + Math.sin(time * 1.2 + h1 * 6.283) * 6;
                color.setHSL(0.56 + h5 * 0.03, 0.98, 0.44 + h5 * 0.28); // Vibrant sapphire/azure
            } else if (t < 0.68) {
                // 3. Fluid Blue Flame Convection Cells
                const rMin = scaleR * 0.65, rMax = scaleR * 1.05;
                const rr = rMin + h1 * (rMax - rMin);
                const theta = h2 * 6.2831853 + time * 0.18;
                const cell = Math.sin(theta * 4 + time * convection * 0.8) + Math.sin(time * convection * 0.6 + h4 * 6.283);
                const rad = rr + cell * 3.0;
                px = rad * Math.cos(theta);
                py = rad * (halfH / halfW) * Math.sin(theta);
                pz = (h3 * 2 - 1) * 55 + Math.sin(time * 1.4 + h2 * 6.283) * 8;
                const heat = (cell + 2) / 4;
                color.setHSL(0.53 + heat * 0.05, 1.0, 0.38 + heat * 0.42); // Electric cyan flare
            } else if (t < 0.84) {
                // 4. Coronal Magnetic Plasma Arches (soaring over top & bottom flanks)
                const loopIndex = Math.floor(i % loopsCount);
                const lh1 = Math.abs(Math.sin(loopIndex * 19.31) * 6543.21) % 1;
                const lh2 = Math.abs(Math.sin(loopIndex * 31.71) * 7654.32) % 1;
                const lh3 = Math.abs(Math.sin(loopIndex * 57.13) * 8765.43) % 1;
                const lh4 = Math.abs(Math.sin(loopIndex * 79.91) * 9876.54) % 1;
                
                const pTheta = lh1 * 6.2831853 + time * 0.12;
                const archBaseR = scaleR * 0.75 + lh2 * scaleR * 0.35;
                const s = h1;
                const bulge = Math.sin(s * 3.14159);
                const archHeight = scaleR * (0.16 + lh3 * 0.18) * magnetic;
                const rad = archBaseR + archHeight * bulge;
                
                px = rad * Math.cos(pTheta + (s - 0.5) * 0.5);
                py = rad * (halfH / halfW) * Math.sin(pTheta + (s - 0.5) * 0.5);
                pz = (s - 0.5) * 60 + Math.sin(time * 1.1 + lh4 * 6.283) * 8;
                
                const pulse = 0.6 + 0.4 * Math.sin(time * 1.0 * magnetic + lh4 * 6.283);
                color.setHSL(0.52 + pulse * 0.03, 1.0, 0.52 + bulge * 0.35); // Luminous cyan arch
            } else {
                // 5. Outflowing Blue Fire Solar Wind & Cosmic Ember Dust
                const theta = h1 * 6.2831853 + time * 0.15;
                const streamDist = (time * windSpeed * 4.5 + h3 * 95) % 95;
                const rad = scaleR * 0.85 + streamDist * 1.1;
                px = rad * Math.cos(theta);
                py = rad * (halfH / halfW) * Math.sin(theta);
                pz = (h2 * 2 - 1) * 75 + Math.sin(time * 1.5 + h4 * 6.283) * 10;
                
                const fade = Math.max(0, 1 - streamDist / 95);
                color.setHSL(0.58, 0.90, 0.22 + fade * 0.50); // Deep cobalt trail fading out
            }
            
            // ─── SERENE SWIRLING VORTEX MOTION (CALM, HYPNOTIC ANGULAR VELOCITY) ───
            const vortexSpeed = 0.08 + (1 - t) * 0.06;
            const ang = time * vortexSpeed + h2 * 6.2831853;
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            
            // Rotate particle dynamically in the vortex plane
            let fx = px * ca - py * sa;
            let fy = px * sa + py * ca;
            let fz = pz + Math.sin(time * 1.3 + h3 * 6.283) * 6.0;

            // ─── BULLETPROOF CENTER TEXT EXCLUSION ZONE (SMOOTH 4th-ORDER SUPERELLIPSE) ───
            const nx = Math.abs(fx) / halfW;
            const ny = Math.abs(fy) / halfH;
            const textDist = Math.pow(Math.pow(nx, 4) + Math.pow(ny, 4), 0.25);
            
            if (textDist < 1.0) {
                // Smoothly repel any particle reaching the central text boundaries
                const push = 1.15 / Math.max(textDist, 0.05);
                fx *= push;
                fy *= push;
            }

            // Smooth scale multiplier: 0 scale when inside or at the boundary, seamlessly 1.0 outside
            const scaleMult = Math.min(1.0, Math.max(0.0, (textDist - 0.95) / 0.18));

            // Varied organic particle sizes (micro diamond dust to radiant glowing embers)
            const baseSize = 0.65 + h1 * 0.70;
            const finalScale = scaleMult * baseSize;

            // Set final 3D destination and lerp position for silky-smooth 60fps dynamics
            this.target.set(fx, fy, fz);
            this.positions[i].lerp(this.target, 0.14);
            
            this.dummy.position.copy(this.positions[i]);
            this.dummy.scale.set(finalScale, finalScale, finalScale);
            this.dummy.updateMatrix();
            
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }
        
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) {
            this.mesh.instanceColor.needsUpdate = true;
        }
        
        this.composer.render();
    }
    
    dispose() {
        this.isDisposed = true;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('mousemove', this.handleMouseMove);
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.mesh);
        this.renderer.dispose();
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
    }
}
