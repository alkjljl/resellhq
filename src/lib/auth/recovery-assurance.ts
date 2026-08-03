type AuthenticationMethod = {
  method?: unknown;
};

type ClaimsWithAuthenticationMethods = {
  amr?: unknown;
};

export function hasRecoveryAssurance(claims: unknown) {
  if (!claims || typeof claims !== "object") return false;

  const methods = (claims as ClaimsWithAuthenticationMethods).amr;
  if (!Array.isArray(methods)) return false;

  return methods.some(
    (entry): entry is AuthenticationMethod =>
      Boolean(
        entry &&
          typeof entry === "object" &&
          (entry as AuthenticationMethod).method === "recovery",
      ),
  );
}
