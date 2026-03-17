import {
  INVALID_PROVIDER_OUTPUT_CODE,
  PERSISTENCE_ERROR_CODE,
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  type RoastDomainErrorCode,
} from "@/lib/roasts/contracts";

export const HOME_SUBMIT_GENERIC_ERROR_MESSAGE =
  "We could not roast your code right now. Try again.";

const HOME_SUBMIT_ERROR_MESSAGES: Partial<
  Record<RoastDomainErrorCode, string>
> = {
  [PROVIDER_TIMEOUT_CODE]:
    "The roast took too long to come back. Try again in a moment.",
  [PROVIDER_UNAVAILABLE_CODE]:
    "The roast engine is unavailable right now. Try again in a moment.",
  [INVALID_PROVIDER_OUTPUT_CODE]:
    "We got a broken roast response this round. Try again.",
  [PERSISTENCE_ERROR_CODE]:
    "We could not save your roast this time. Try again.",
};

export function getHomeSubmitErrorMessage(code?: string) {
  if (!code) {
    return HOME_SUBMIT_GENERIC_ERROR_MESSAGE;
  }

  return (
    HOME_SUBMIT_ERROR_MESSAGES[code as RoastDomainErrorCode] ??
    HOME_SUBMIT_GENERIC_ERROR_MESSAGE
  );
}
