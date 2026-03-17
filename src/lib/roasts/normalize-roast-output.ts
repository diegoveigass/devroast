import {
  INVALID_PROVIDER_OUTPUT_CODE,
  RoastDomainError,
  type RoastProviderOutput,
  roastProviderOutputSchema,
} from "./contracts";

export function normalizeRoastOutput(payload: unknown): RoastProviderOutput {
  const parsedPayload = roastProviderOutputSchema.safeParse(payload);

  if (!parsedPayload.success) {
    throw new RoastDomainError(
      INVALID_PROVIDER_OUTPUT_CODE,
      "Provider output does not match the roast contract.",
      { cause: parsedPayload.error },
    );
  }

  return parsedPayload.data;
}
