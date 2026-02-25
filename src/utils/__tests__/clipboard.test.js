import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyToClipboard } from "../clipboard";

describe("copyToClipboard", () => {
  beforeEach(() => {
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(),
      },
    };
  });

  it("returns true when writeText succeeds", async () => {
    const result = await copyToClipboard("test-id");

    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-id");
  });

  it("returns false when writeText throws", async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(new Error("fail"));

    const result = await copyToClipboard("test-id");

    expect(result).toBe(false);
  });
});
