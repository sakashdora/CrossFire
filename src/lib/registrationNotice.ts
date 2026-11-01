// Presentation rules for the "registration is live" announcement. Nothing here
// authorises anything: the server decides whether a registration is accepted.

/** Change the version to run a new campaign; reopening registration does not reset it. */
export const REGISTRATION_NOTICE_KEY = 'crossfire:registration-live:2026:v1';
export const REGISTRATION_NOTICE_DELAY_MS = 900;
const SEEN = '1';

/** Maps the public registration setting RPC result. Only a boolean is trusted; nothing defaults to open. */
export const registrationStatusFromSetting = (data: unknown, error: unknown): 'open' | 'closed' | 'error' =>
  !error && typeof data === 'boolean' ? (data ? 'open' : 'closed') : 'error';

export interface NoticeConditions {
  view: string;
  authStatus: string;
  registrationStatus: string;
  documentVisible: boolean;
  introActive: boolean;
  authModalOpen: boolean;
  /** True after returning to the tab until a fresh registration-status result arrives. */
  awaitingFreshStatus: boolean;
}

/** Everything that must hold for the notice to be scheduled or to stay open. */
export const noticeConditionsMet = (conditions: NoticeConditions) =>
  conditions.view === 'landing' &&
  conditions.authStatus === 'anonymous' &&
  conditions.registrationStatus === 'open' &&
  conditions.documentVisible &&
  !conditions.introActive &&
  !conditions.authModalOpen &&
  !conditions.awaitingFreshStatus;

type ElementLike = { tagName?: string; type?: string; isContentEditable?: boolean } | null | undefined;
const NON_TEXT_INPUTS = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'hidden'];

/** Whether focus is in a control the visitor may be typing into. */
export const isEditableElement = (element: ElementLike) => {
  if (!element?.tagName) return false;
  const tag = element.tagName.toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable) return true;
  return tag === 'INPUT' && !NON_TEXT_INPUTS.includes((element.type || 'text').toLowerCase());
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Remembers that this tab session has seen the campaign. Only a fixed flag is
 * stored. If storage is unavailable the flag lives in memory for this page load.
 */
export const createNoticeMemory = (getStorage: () => StorageLike | null | undefined) => {
  let seen = false;
  const storage = () => { try { return getStorage() ?? null; } catch { return null; } };
  return {
    hasSeen() {
      if (seen) return true;
      try {
        const store = storage();
        const value = store?.getItem(REGISTRATION_NOTICE_KEY) ?? null;
        if (value === SEEN) return (seen = true);
        // Anything else was not written by this campaign: discard it.
        if (value !== null) store?.removeItem(REGISTRATION_NOTICE_KEY);
      } catch { /* storage denied */ }
      return false;
    },
    markSeen() {
      seen = true;
      try { storage()?.setItem(REGISTRATION_NOTICE_KEY, SEEN); } catch { /* storage denied */ }
    },
  };
};
