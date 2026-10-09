import { ArrowUpRight } from 'lucide-react';
import './navigation.css';

export function Footer({ setCurrentView }: { setCurrentView?: (view: string) => void }) {
  return <footer className="cf-footer"><div className="cf-footer-inner">
    <button className="cf-footer-brand" onClick={() => { setCurrentView?.('landing'); window.scrollTo({ top: 0, behavior: 'auto' }); }} aria-label="CrossFire home"><img src="/hero-flame-reticle.png" alt="" width="42" height="44" /><img src="/hero-crossfire-title.png" alt="CrossFire" width="145" height="35" /></button>
    <a className="cf-footer-academy" href="https://maps.google.com/?q=Srusti+Academy+of+Graduate+Studies+Bhubaneswar" target="_blank" rel="noreferrer">Srusti Academy of Management and Technology</a>
    <a href="mailto:mail@srustiacademy.ac.in">mail@srustiacademy.ac.in</a>
    <a href="/crossfire-2026-brochure.pdf" target="_blank" rel="noreferrer">Brochure <ArrowUpRight size={15} /></a>
    <span>© 2026 CROSSFIRE</span>
  </div></footer>;
}
