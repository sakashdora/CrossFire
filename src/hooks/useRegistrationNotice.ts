import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createNoticeMemory,
  isEditableElement,
  noticeConditionsMet,
  REGISTRATION_NOTICE_DELAY_MS,
} from '../lib/registrationNotice';

const memory = createNoticeMemory(() => window.sessionStorage);

interface Options {
  view: string;
  introActive: boolean;
  authModalOpen: boolean;
}

/**
 * Decides when the registration announcement is shown. It reuses the auth
 * context's status polling and never queries anything itself.
 */
export function useRegistrationNotice({ view, introActive, authModalOpen }: Options) {
  const { authStatus, registrationStatus, registrationCheckCount } = useAuth();
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const [checkCountOnReturn, setCheckCountOnReturn] = useState<number | null>(null);
  // Set once the campaign was shown, dismissed or interrupted during this page load.
  const [suppressed, setSuppressed] = useState(() => memory.hasSeen());
  const [requested, setRequested] = useState(false);

  const checkCount = useRef(registrationCheckCount);
  checkCount.current = registrationCheckCount;
  useEffect(() => {
    const onVisibility = () => {
      setDocumentVisible(!document.hidden);
      // On return, wait for the refresh the auth context starts before scheduling.
      if (!document.hidden) setCheckCountOnReturn(checkCount.current);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const conditionsMet = noticeConditionsMet({
    view, authStatus, registrationStatus, documentVisible, introActive, authModalOpen,
    awaitingFreshStatus: checkCountOnReturn !== null && registrationCheckCount <= checkCountOnReturn,
  });
  const latest = useRef({ conditionsMet, suppressed, view });
  latest.current = { conditionsMet, suppressed, view };

  // Opening sign-in or having an account ends automatic prompts for this visit.
  useEffect(() => {
    if (authModalOpen || authStatus === 'authenticated') setSuppressed(true);
  }, [authModalOpen, authStatus]);

  // Any system change (route, sign-in, intro, closure, error, hidden tab) closes it.
  useEffect(() => {
    if (!conditionsMet) setRequested(false);
  }, [conditionsMet]);

  const cancelledOnView = useRef<string | null>(null);
  useEffect(() => {
    if (!conditionsMet || suppressed || requested) return;
    let fired = false;
    cancelledOnView.current = null;
    const timer = window.setTimeout(() => {
      fired = true;
      if (!latest.current.conditionsMet || latest.current.suppressed || document.hidden) return;
      if (memory.hasSeen() || isEditableElement(document.activeElement as HTMLElement | null) || document.querySelector('dialog[open]')) {
        setSuppressed(true);
        return;
      }
      setRequested(true);
    }, REGISTRATION_NOTICE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      if (!fired) cancelledOnView.current = latest.current.view;
    };
  }, [conditionsMet, suppressed, requested]);

  // Leaving the page while the prompt is pending cancels it for this visit.
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current !== view) {
      if (cancelledOnView.current === view) setSuppressed(true);
      cancelledOnView.current = null;
      previousView.current = view;
    }
  }, [view]);

  const onOpened = useCallback(() => { memory.markSeen(); setSuppressed(true); }, []);
  const onOpenFailed = useCallback(() => { setSuppressed(true); setRequested(false); }, []);
  const dismiss = useCallback(() => { memory.markSeen(); setSuppressed(true); setRequested(false); }, []);
  /** Re-checks the latest conditions before acting on a button. */
  const isCurrent = useCallback(() => latest.current.conditionsMet, []);

  return { show: requested && conditionsMet, onOpened, onOpenFailed, dismiss, isCurrent };
}
