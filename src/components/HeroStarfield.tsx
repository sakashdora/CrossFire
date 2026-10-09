import { useEffect, useRef } from 'react';

/** A capped Canvas 2D particle field; sleeps when hidden or outside the viewport. */
export function HeroStarfield({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elapsedRef = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    let width = 0, height = 0, frame = 0, lastTime = 0, inView = true;
    let pointerX = 0, pointerY = 0, offsetX = 0, offsetY = 0;
    let particles: { x: number; y: number; depth: number; phase: number; ember: boolean }[] = [];
    const sprites = ['#57deff', '#ff8048'].map(color => {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 32;
      const brush = sprite.getContext('2d')!;
      const glow = brush.createRadialGradient(16, 16, 0, 16, 16, 16);
      glow.addColorStop(0, '#e8fcff');
      glow.addColorStop(.12, color);
      glow.addColorStop(.3, `${color}80`);
      glow.addColorStop(1, `${color}00`);
      brush.fillStyle = glow;
      brush.fillRect(0, 0, 32, 32);
      return sprite;
    });
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const seconds = elapsedRef.current;
      // One quiet orbit frames the content; two moving highlights reveal the motion.
      const orbitX = width * .5, orbitY = height * .55;
      const radiusX = width * .56, radiusY = height * .32, tilt = .12;
      const orbitPoint = (angle: number) => ({
        x: orbitX + Math.cos(angle) * radiusX * Math.cos(tilt) - Math.sin(angle) * radiusY * Math.sin(tilt),
        y: orbitY + Math.cos(angle) * radiusX * Math.sin(tilt) + Math.sin(angle) * radiusY * Math.cos(tilt),
      });
      const orbitGlow = context.createLinearGradient(0, height * .2, width, height * .85);
      orbitGlow.addColorStop(0, '#00bddf');
      orbitGlow.addColorStop(.5, '#00d5f5');
      orbitGlow.addColorStop(.8, '#ff722a');
      orbitGlow.addColorStop(1, '#ff5917');
      context.strokeStyle = orbitGlow;
      context.beginPath();
      context.ellipse(orbitX, orbitY, radiusX, radiusY, tilt, 0, Math.PI * 2);
      context.globalAlpha = .045;
      context.lineWidth = 9;
      context.stroke();
      context.globalAlpha = .28;
      context.lineWidth = 1;
      context.stroke();
      for (let index = 0; index < 2; index++) {
        const head = seconds * .24 + Math.PI * (index + 1.18);
        for (let step = 0; step < 28; step++) {
          const point = orbitPoint(head - step * .009);
          context.globalAlpha = (1 - step / 28) * .2;
          context.drawImage(sprites[index], point.x - 4, point.y - 4, 8, 8);
        }
        const point = orbitPoint(head);
        context.globalAlpha = .85;
        context.drawImage(sprites[index], point.x - 15, point.y - 15, 30, 30);
      }
      for (const particle of particles) {
        const { depth, phase, ember } = particle;
        const x = (particle.x * width + Math.sin(seconds * .3 + phase) * 32 + offsetX * depth + width) % width;
        const y = ((particle.y * height - seconds * (12 + depth * 30) + offsetY * depth) % height + height) % height;
        const size = 3 + depth * (ember ? 17 : 9);
        const centerFade = Math.abs(x - width / 2) < width * .27 ? .18 : 1;
        context.globalAlpha = (.52 + Math.sin(seconds * 1.1 + phase) * .2) * centerFade;
        context.drawImage(sprites[ember ? 1 : 0], x - size / 2, y - size / 2, size, size);
      }
      context.globalAlpha = 1;
    };
    const resize = () => {
      ({ width, height } = canvas.getBoundingClientRect());
      if (!width || !height) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      let seed = 2026;
      const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const count = Math.min(width < 600 ? 100 : 230, Math.round(width * height / 3900));
      particles = Array.from({ length: count }, () => ({ x: random(), y: random(), depth: random(), phase: random() * Math.PI * 2, ember: random() > .68 }));
      draw();
    };
    const tick = (now: number) => {
      if (!lastTime) lastTime = now;
      const delta = now - lastTime;
      // Cap rendering at 30 fps, including on high refresh rate displays.
      if (delta >= 1000 / 30) {
        elapsedRef.current += Math.min(delta, 80) / 1000;
        offsetX += (pointerX - offsetX) * .045;
        offsetY += (pointerY - offsetY) * .045;
        draw();
        lastTime = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const synchronize = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      if (active && inView && !document.hidden && !motionPreference.matches) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || !active || motionPreference.matches) return;
      const bounds = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / width - .5) * 28;
      pointerY = ((event.clientY - bounds.top) / height - .5) * 20;
    };
    const resetPointer = () => { pointerX = pointerY = 0; };
    const scene = canvas.parentElement;
    const resizeObserver = new ResizeObserver(resize);
    const visibilityObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; synchronize(); });
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    document.addEventListener('visibilitychange', synchronize);
    motionPreference.addEventListener('change', synchronize);
    scene?.addEventListener('pointermove', move);
    scene?.addEventListener('pointerleave', resetPointer);
    resize(); synchronize();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect(); visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', synchronize);
      motionPreference.removeEventListener('change', synchronize);
      scene?.removeEventListener('pointermove', move);
      scene?.removeEventListener('pointerleave', resetPointer);
    };
  }, [active]);
  return <canvas ref={canvasRef} className="cf-starfield" aria-hidden="true" />;
}
