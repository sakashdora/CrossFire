import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react';
import { ArrowRight, GraduationCap, Megaphone, X } from 'lucide-react';
import './registration-live-notice.css';

interface RegistrationLiveNoticeProps {
  open: boolean;
  onOpened: () => void;
  onOpenFailed: () => void;
  onDismiss: () => void;
  onRegister: () => void;
  onSignIn: () => void;
}

const focusIfConnected = (target: Element | null) => {
  if (target instanceof HTMLElement && target.isConnected && target !== document.body) {
    target.focus({ preventScroll: true });
    return true;
  }
  return false;
};

/** Announcement that student registration is open. Visibility is decided by useRegistrationNotice. */
export function RegistrationLiveNotice({ open, onOpened, onOpenFailed, onDismiss, onRegister, onSignIn }: RegistrationLiveNoticeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const savedScroll = useRef<{ overflow: string; paddingRight: string } | null>(null);
  const closingRef = useRef(false);
  const pointerStartedOutside = useRef(false);

  const unlockScroll = useCallback(() => {
    const saved = savedScroll.current;
    if (!saved) return;
    savedScroll.current = null;
    const style = document.body.style;
    // Leave the page alone if another modal has taken over scrolling since.
    if (style.overflow === 'hidden') {
      style.overflow = saved.overflow;
      style.paddingRight = saved.paddingRight;
    }
  }, []);

  /** Closes the dialog without reporting it as a visitor dismissal. */
  const close = useCallback((focus: 'previous' | 'previous-or-main' | 'none') => {
    const dialog = dialogRef.current;
    closingRef.current = true;
    if (dialog?.open) dialog.close();
    closingRef.current = false;
    unlockScroll();
    const target = returnFocus.current;
    returnFocus.current = null;
    if (focus !== 'none' && !focusIfConnected(target) && focus === 'previous-or-main') {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [unlockScroll]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement;
      try {
        dialog.showModal();
      } catch {
        returnFocus.current = null;
        onOpenFailed();
        return;
      }
      const style = document.body.style;
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      savedScroll.current = { overflow: style.overflow, paddingRight: style.paddingRight };
      style.overflow = 'hidden';
      if (scrollbar > 0) style.paddingRight = `${scrollbar}px`;
      // Keep the message visible on short screens instead of jumping down to the CTA.
      dialog.scrollTop = 0;
      const initialFocus = dialog.scrollHeight > dialog.clientHeight ? titleRef.current : primaryRef.current;
      initialFocus?.focus({ preventScroll: true });
      onOpened();
    } else if (!open && dialog.open) {
      close('previous');
    }
  }, [open, onOpened, onOpenFailed, close]);

  useEffect(() => () => close('none'), [close]);

  const dismiss = () => {
    if (!dialogRef.current?.open) return;
    close('previous-or-main');
    onDismiss();
  };
  const register = () => {
    if (!dialogRef.current?.open) return;
    close('none');
    onRegister();
  };
  const signIn = () => {
    if (!dialogRef.current?.open) return;
    // Focus returns here first so the sign-in dialog restores it when it closes.
    close('previous-or-main');
    onSignIn();
  };

  const isOutside = (event: PointerEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return false;
    const box = event.currentTarget.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };

  return (
    <dialog
      ref={dialogRef}
      className="cf-reg-notice"
      aria-labelledby="cf-reg-notice-title"
      aria-describedby="cf-reg-notice-subtitle cf-reg-notice-body"
      onCancel={event => { event.preventDefault(); dismiss(); }}
      onClose={() => {
        // The browser closed it without us (for example a repeated Escape).
        if (closingRef.current || !savedScroll.current) return;
        unlockScroll();
        focusIfConnected(returnFocus.current) || document.getElementById('main-content')?.focus({ preventScroll: true });
        returnFocus.current = null;
        onDismiss();
      }}
      // Only a press that starts and ends on the backdrop dismisses.
      onPointerDown={event => { pointerStartedOutside.current = isOutside(event); }}
      onPointerUp={event => {
        const started = pointerStartedOutside.current;
        pointerStartedOutside.current = false;
        if (started && isOutside(event)) dismiss();
      }}
    >
      <div className="cf-reg-notice__card">
        <div className="cf-reg-notice__accent" aria-hidden="true" />
        <button type="button" className="cf-reg-notice__close" aria-label="Close registration announcement" onClick={dismiss}>
          <X size={20} aria-hidden="true" />
        </button>
        <div className="cf-reg-notice__icon" aria-hidden="true"><Megaphone size={42} strokeWidth={1.8} /></div>
        <p className="cf-reg-notice__status"><span className="cf-reg-notice__dot" aria-hidden="true" />Registration open</p>
        <p className="cf-reg-notice__eyebrow">CrossFire 2026</p>
        <h2 ref={titleRef} tabIndex={-1} id="cf-reg-notice-title" className="cf-reg-notice__title">Registration is now <span>LIVE</span></h2>
        <p id="cf-reg-notice-subtitle" className="cf-reg-notice__subtitle"><GraduationCap size={28} aria-hidden="true" /><span>For +2 final-year students</span></p>
        <p id="cf-reg-notice-body" className="cf-reg-notice__body">
          Create your student account, choose your competitions, and get your QR entry pass after successful registration.
        </p>
        <div className="cf-reg-notice__actions">
          <button ref={primaryRef} type="button" className="cf-reg-notice__primary" onClick={register}>
            Register now <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button type="button" className="cf-reg-notice__secondary" onClick={dismiss}>Maybe later</button>
        </div>
        <p className="cf-reg-notice__footer">
          Already registered? <button type="button" className="cf-reg-notice__link" onClick={signIn}>Sign in</button>
        </p>
      </div>
    </dialog>
  );
}
