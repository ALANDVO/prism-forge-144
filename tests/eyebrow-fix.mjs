// tests/eyebrow-fix.mjs
// Unit tests for eyebrow detection fixes (Issue #175)

import { test, describe } from "node:test";
import assert from "node:assert";
import { isInFigcaption, isInScrollingOrClippingContainer, looksLikeKicker } from "../lib/probe.mjs";

describe("eyebrow detection fixes", () => {
  test("looksLikeKicker identifies uppercase kicker text", () => {
    assert(looksLikeKicker("KICKER LABEL", 13));
    assert(looksLikeKicker("SMALL TITLE", 14));
    assert(looksLikeKicker("INTRO", 12));
  });

  test("looksLikeKicker rejects lowercase text", () => {
    assert(!looksLikeKicker("regular text", 13));
    assert(!looksLikeKicker("Some Title", 13));
  });

  test("looksLikeKicker rejects large font size", () => {
    assert(!looksLikeKicker("KICKER", 19));
    assert(!looksLikeKicker("KICKER", 24));
  });

  test("looksLikeKicker rejects long text", () => {
    assert(!looksLikeKicker("THIS IS A VERY VERY LONG KICKER LABEL THAT EXCEEDS THE LIMIT FOR SURE", 13));
  });

  test("looksLikeKicker rejects empty text", () => {
    assert(!looksLikeKicker("", 13));
    assert(!looksLikeKicker("   ", 13));
  });

  test("looksLikeKicker requires at least 2 letters", () => {
    assert(!looksLikeKicker("A", 13));
    assert(looksLikeKicker("AB", 13));
  });

  // Note: isInFigcaption and isInScrollingOrClippingContainer require DOM
  // and are tested via integration tests in inspect.mjs
});
