import assert from "node:assert/strict";
import test from "node:test";

import {
  getHomeSubmitErrorMessage,
  HOME_SUBMIT_GENERIC_ERROR_MESSAGE,
} from "./home-submit-error-message";

test("returns retry-friendly copy for known roast domain codes", () => {
  assert.equal(
    getHomeSubmitErrorMessage("PROVIDER_TIMEOUT"),
    "The roast took too long to come back. Try again in a moment.",
  );
  assert.equal(
    getHomeSubmitErrorMessage("PROVIDER_UNAVAILABLE"),
    "The roast engine is unavailable right now. Try again in a moment.",
  );
  assert.equal(
    getHomeSubmitErrorMessage("INVALID_PROVIDER_OUTPUT"),
    "We got a broken roast response this round. Try again.",
  );
  assert.equal(
    getHomeSubmitErrorMessage("PERSISTENCE_ERROR"),
    "We could not save your roast this time. Try again.",
  );
});

test("falls back to a generic retry-friendly message for unknown failures", () => {
  assert.equal(
    getHomeSubmitErrorMessage("SOMETHING_ELSE"),
    HOME_SUBMIT_GENERIC_ERROR_MESSAGE,
  );
  assert.equal(getHomeSubmitErrorMessage(), HOME_SUBMIT_GENERIC_ERROR_MESSAGE);
});
