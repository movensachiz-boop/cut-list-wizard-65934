import { describe, expect, test } from "bun:test";
import { ABV_PAYMENT_DATE, canAcknowledgeAbvNotice, isAbvNoticeRecipient } from "./abvNotice";

describe("ABV subscription notice", () => {
  test("payment is due on 12 November 2026", () => {
    expect(ABV_PAYMENT_DATE).toBe("2026-11-12");
  });
  test("targets ABV and their restored permanent license only", () => {
    expect(isAbvNoticeRecipient(" ABV BOARDS")).toBe(true);
    expect(isAbvNoticeRecipient("ABV Zimbabwe")).toBe(true);
    expect(isAbvNoticeRecipient("PERMANENT LICENSE")).toBe(true);
    expect(isAbvNoticeRecipient("boardex Zimbabwe")).toBe(false);
    expect(isAbvNoticeRecipient("DATAPLEX PROPERTIES")).toBe(false);
  });
  test("requires a download before continuing", () => {
    expect(canAcknowledgeAbvNotice(false)).toBe(false);
    expect(canAcknowledgeAbvNotice(true)).toBe(true);
  });
});