import { useEffect, type RefObject } from 'react';

export function useScrollReveal(root: RefObject<HTMLElement>, enabled: boolean, eventCount: number) {
  useEffect(() => {
    if (!enabled || !root.current) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const elements = root.current.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('cf-is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: .08 });
    function clear() {
      observer.disconnect();
      elements.forEach(el => el.classList.remove('cf-reveal', 'cf-is-visible'));
    }
    function sync() {
      clear();
      if (preference.matches) return;
      elements.forEach(el => { el.classList.add('cf-reveal'); observer.observe(el); });
    }
    sync();
    preference.addEventListener('change', sync);
    return () => { clear(); preference.removeEventListener('change', sync); };
  }, [root, enabled, eventCount]);
}
