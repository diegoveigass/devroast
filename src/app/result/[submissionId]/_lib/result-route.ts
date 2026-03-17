const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ResultRouteParams = {
  submissionId: string;
};

export function resolveResultRouteParams(params: ResultRouteParams) {
  if (!UUID_REGEX.test(params.submissionId)) {
    return { kind: "invalid" } as const;
  }

  return {
    kind: "valid",
    submissionId: params.submissionId,
  } as const;
}
