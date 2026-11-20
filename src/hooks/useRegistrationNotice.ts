import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createNoticeMemory,
  isEditableElement,
  noticeConditionsMet,
  REGISTRATION_NOTICE_DELAY_MS,
} from '../lib/registrationNotice';

const memory = createNoticeMemory(() => window.sessionStorage);
const IS_SHOWCASE_MODE = import.meta.env.VITE_SHOWCASE_MODE !== 'false';

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

  const conditionsMet = !IS_SHOWCASE_MODE && noticeConditionsMet({
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
    cancelledOnView.current = null;
    const timer = window.setTimeout(() => {
      // Don't interrupt while the visitor is actively typing.
      if (isEditableElement(document.activeElement)) {
        setSuppressed(true);
        return;
      }
      if (latest.current.conditionsMet && !latest.current.suppressed) setRequested(true);
    }, REGISTRATION_NOTICE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      // If we unmount because the visitor moved to another view before the delay
      // completed, don't try again on later views during this page load.
      if (latest.current.view !== view) cancelledOnView.current = view;
    };
  }, [conditionsMet, suppressed, requested, view]);

  const dismiss = useCallback(() => {
    setRequested(false);
    setSuppressed(true);
    memory.markSeen();
  }, []);

  const onOpened = useCallback(() => {
    memory.markSeen();
  }, []);

  const onOpenFailed = useCallback(() => {
    setRequested(false);
    setSuppressed(true);
  }, []);

  const isCurrent = useCallback(() => latest.current.conditionsMet, []);

  return {
    show: requested && conditionsMet && !suppressed,
    dismiss,
    onOpened,
    onOpenFailed,
    isCurrent,
  };
}
