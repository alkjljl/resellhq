import { describe, expect, it } from "vitest";
import { createSupabaseQueryError } from "./query-error";

describe("createSupabaseQueryError", () => {
  it("retains the sanitized Supabase diagnostic fields", () => {
    const source = {
      code: "42703",
      message: "column profiles.first_name does not exist",
      details: null,
      hint: "Apply the required migration",
    };

    const error = createSupabaseQueryError(
      "Unable to load the account profile",
      source,
    );

    expect(error.message).toBe(
      "Unable to load the account profile; code=42703; message=column profiles.first_name does not exist; details=none; hint=Apply the required migration",
    );
    expect(error.cause).toBe(source);
  });
});
