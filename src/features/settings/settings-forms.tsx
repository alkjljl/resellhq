"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useActionState, useEffect, useMemo, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { initialActionState, type ActionState } from "@/lib/actions/state";
import {
  BUSINESS_TYPES,
  COUNTRY_CODES,
  FALLBACK_CURRENCIES,
  FALLBACK_TIME_ZONES,
  LOCALES,
} from "@/lib/constants/international";
import { countryName, localeName } from "@/lib/formatting/international";
import {
  businessSchema,
  preferencesSchema,
  profileSchema,
  type BusinessInput,
  type BusinessValues,
  type PreferencesValues,
  type ProfileValues,
} from "@/lib/validation/account";
import {
  saveBusinessAction,
  savePreferencesAction,
  saveProfileAction,
} from "./actions";

function toFormData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function FormStatus({ state }: { state: ActionState }) {
  return state.message ? (
    <Alert tone={state.status === "success" ? "success" : "error"}>
      {state.message}
    </Alert>
  ) : null;
}

function ErrorSummary({ errors }: { errors: Array<string | undefined> }) {
  const messages = [...new Set(errors.filter((error): error is string => Boolean(error)))];
  return messages.length > 0 ? (
    <Alert>
      <div>
        <p className="font-semibold">Review these fields</p>
        <ul className="mt-1 list-disc pl-4">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </Alert>
  ) : null;
}

export function ProfileSettingsForm({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [state, action] = useActionState(saveProfileAction, initialActionState);
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName },
  });

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(() => action(toFormData(values))),
      )}
    >
      <ErrorSummary
        errors={[
          form.formState.errors.displayName?.message,
          state.fieldErrors?.displayName?.[0],
        ]}
      />
      <FormField
        id="displayName"
        label="Display name"
        error={
          form.formState.errors.displayName?.message ??
          state.fieldErrors?.displayName?.[0]
        }
      >
        <Input
          id="displayName"
          autoComplete="name"
          aria-invalid={Boolean(
            form.formState.errors.displayName ?? state.fieldErrors?.displayName,
          )}
          aria-describedby={
            form.formState.errors.displayName ?? state.fieldErrors?.displayName
              ? "displayName-error"
              : undefined
          }
          {...form.register("displayName")}
        />
      </FormField>
      <FormField
        id="accountEmail"
        label="Account email"
        description="Email changes are managed through your authentication provider."
      >
        <Input
          id="accountEmail"
          value={email}
          readOnly
          disabled
          aria-describedby="accountEmail-description"
        />
      </FormField>
      <FormStatus state={state} />
      <div className="flex justify-end border-t border-[var(--line)] pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

export function BusinessSettingsForm({
  defaults,
}: {
  defaults: {
    workspaceName: string;
    businessName: string;
    businessType: BusinessInput["businessType"];
    countryCode: string;
  };
}) {
  const [state, action] = useActionState(saveBusinessAction, initialActionState);
  const [pending, startTransition] = useTransition();
  const form = useForm<BusinessInput, unknown, BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      ...defaults,
      businessName: defaults.businessName ?? "",
    },
  });
  const countries = useMemo(
    () =>
      COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [],
  );

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          action(
            toFormData({
              ...values,
              businessName: values.businessName ?? "",
            }),
          ),
        ),
      )}
    >
      <ErrorSummary
        errors={[
          form.formState.errors.workspaceName?.message,
          form.formState.errors.businessName?.message,
          form.formState.errors.businessType?.message,
          form.formState.errors.countryCode?.message,
          state.fieldErrors?.workspaceName?.[0],
          state.fieldErrors?.businessName?.[0],
          state.fieldErrors?.businessType?.[0],
          state.fieldErrors?.countryCode?.[0],
        ]}
      />
      <FormField
        id="workspaceName"
        label="Workspace or store name"
        error={
          form.formState.errors.workspaceName?.message ??
          state.fieldErrors?.workspaceName?.[0]
        }
      >
        <Input
          id="workspaceName"
          autoComplete="organization"
          aria-invalid={Boolean(
            form.formState.errors.workspaceName ??
              state.fieldErrors?.workspaceName,
          )}
          aria-describedby={
            form.formState.errors.workspaceName ??
            state.fieldErrors?.workspaceName
              ? "workspaceName-error"
              : undefined
          }
          {...form.register("workspaceName")}
        />
      </FormField>
      <FormField
        id="businessName"
        label="Business name (optional)"
        description="This customer-facing name is separate from the internal workspace name. Clear it to remove it."
        error={
          form.formState.errors.businessName?.message ??
          state.fieldErrors?.businessName?.[0]
        }
      >
        <Input
          id="businessName"
          autoComplete="organization"
          aria-invalid={Boolean(
            form.formState.errors.businessName ??
              state.fieldErrors?.businessName,
          )}
          aria-describedby={
            form.formState.errors.businessName ??
            state.fieldErrors?.businessName
              ? "businessName-description businessName-error"
              : "businessName-description"
          }
          {...form.register("businessName")}
        />
      </FormField>
      <FormField
        id="businessType"
        label="Business type"
        error={
          form.formState.errors.businessType?.message ??
          state.fieldErrors?.businessType?.[0]
        }
      >
        <Select
          id="businessType"
          aria-invalid={Boolean(
            form.formState.errors.businessType ??
              state.fieldErrors?.businessType,
          )}
          aria-describedby={
            form.formState.errors.businessType ??
            state.fieldErrors?.businessType
              ? "businessType-error"
              : undefined
          }
          {...form.register("businessType")}
        >
          <option value="">Choose a business type</option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        id="countryCode"
        label="Country"
        error={
          form.formState.errors.countryCode?.message ??
          state.fieldErrors?.countryCode?.[0]
        }
      >
        <Select
          id="countryCode"
          aria-invalid={Boolean(
            form.formState.errors.countryCode ?? state.fieldErrors?.countryCode,
          )}
          aria-describedby={
            form.formState.errors.countryCode ?? state.fieldErrors?.countryCode
              ? "countryCode-error"
              : undefined
          }
          {...form.register("countryCode")}
        >
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormStatus state={state} />
      <div className="flex justify-end border-t border-[var(--line)] pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save business settings"}
        </Button>
      </div>
    </form>
  );
}

export function PreferencesSettingsForm({
  defaults,
}: {
  defaults: PreferencesValues;
}) {
  const [state, action] = useActionState(
    savePreferencesAction,
    initialActionState,
  );
  const [pending, startTransition] = useTransition();
  const submittedTheme = useRef(defaults.themePreference);
  const { setTheme } = useTheme();
  const form = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: defaults,
  });
  const currencies = useMemo(() => {
    try {
      return Intl.supportedValuesOf("currency");
    } catch {
      return [...FALLBACK_CURRENCIES];
    }
  }, []);
  const timeZones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [...FALLBACK_TIME_ZONES];
    }
  }, []);

  useEffect(() => {
    if (state.status === "success") setTheme(submittedTheme.current);
  }, [setTheme, state.status]);

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        submittedTheme.current = values.themePreference;
        startTransition(() => action(toFormData(values)));
      })}
    >
      <ErrorSummary
        errors={[
          form.formState.errors.defaultCurrency?.message,
          form.formState.errors.locale?.message,
          form.formState.errors.timeZone?.message,
          form.formState.errors.themePreference?.message,
          state.fieldErrors?.defaultCurrency?.[0],
          state.fieldErrors?.locale?.[0],
          state.fieldErrors?.timeZone?.[0],
          state.fieldErrors?.themePreference?.[0],
        ]}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="defaultCurrency"
          label="Default currency"
          error={
            form.formState.errors.defaultCurrency?.message ??
            state.fieldErrors?.defaultCurrency?.[0]
          }
        >
          <Select
            id="defaultCurrency"
            aria-invalid={Boolean(
              form.formState.errors.defaultCurrency ??
                state.fieldErrors?.defaultCurrency,
            )}
            aria-describedby={
              form.formState.errors.defaultCurrency ??
              state.fieldErrors?.defaultCurrency
                ? "defaultCurrency-error"
                : undefined
            }
            {...form.register("defaultCurrency")}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          id="locale"
          label="Language and locale"
          error={
            form.formState.errors.locale?.message ??
            state.fieldErrors?.locale?.[0]
          }
        >
          <Select
            id="locale"
            aria-invalid={Boolean(
              form.formState.errors.locale ?? state.fieldErrors?.locale,
            )}
            aria-describedby={
              form.formState.errors.locale ?? state.fieldErrors?.locale
                ? "locale-error"
                : undefined
            }
            {...form.register("locale")}
          >
            {Array.from(new Set([defaults.locale, ...LOCALES])).map((locale) => (
              <option key={locale} value={locale}>
                {localeName(locale)} ({locale})
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField
        id="timeZone"
        label="Time zone"
        error={
          form.formState.errors.timeZone?.message ??
          state.fieldErrors?.timeZone?.[0]
        }
      >
        <Select
          id="timeZone"
          aria-invalid={Boolean(
            form.formState.errors.timeZone ?? state.fieldErrors?.timeZone,
          )}
          aria-describedby={
            form.formState.errors.timeZone ?? state.fieldErrors?.timeZone
              ? "timeZone-error"
              : undefined
          }
          {...form.register("timeZone")}
        >
          {Array.from(new Set([defaults.timeZone, ...timeZones])).map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField
        id="themePreference"
        label="Color theme"
        description="Your theme preference belongs to your user profile, not the shared workspace."
        error={
          form.formState.errors.themePreference?.message ??
          state.fieldErrors?.themePreference?.[0]
        }
      >
        <Select
          id="themePreference"
          aria-invalid={Boolean(
            form.formState.errors.themePreference ??
              state.fieldErrors?.themePreference,
          )}
          aria-describedby={
            form.formState.errors.themePreference ??
            state.fieldErrors?.themePreference
              ? "themePreference-description themePreference-error"
              : "themePreference-description"
          }
          {...form.register("themePreference")}
        >
          <option value="system">Match device</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
      </FormField>
      <FormStatus state={state} />
      <div className="flex justify-end border-t border-[var(--line)] pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}
