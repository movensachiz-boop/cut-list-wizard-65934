export const ABV_NOTICE_ID = "abv-subscription-2026-11-12";
export const ABV_PAYMENT_DATE = "2026-11-12";

// ABV currently uses the restored license labelled PERMANENT LICENSE.
export const isAbvNoticeRecipient = (companyName: string): boolean =>
  /^(abv(?:\s+(?:boards|zimbabwe))?|permanent license)$/i.test(companyName.trim());

export const canAcknowledgeAbvNotice = (downloadStarted: boolean): boolean => downloadStarted;