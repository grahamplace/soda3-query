import { describe, it, expect } from "vitest";
import { hello } from "../src/index";

describe("hello", () => {
  it("greets by name", () => {
    expect(hello("Graham")).toBe("Hello, Graham!");
  });

  it("can be loud", () => {
    expect(hello("World", { loud: true })).toBe("HELLO, WORLD!");
  });
});
