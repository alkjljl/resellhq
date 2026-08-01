"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { initialActionState } from "@/lib/actions/state";
import {
  BUSINESS_TYPES,
  COUNTRY_CODES,
  EXPERIENCE_LEVELS,
  FALLBACK_CURRENCIES,
  FALLBACK_TIME_ZONES,
  LOCALES,
  PRIMARY_CATEGORIES,
  SELLING_CHANNELS,
} from "@/lib/constants/international";
import { countryName, localeName } from "@/lib/formatting/international";
import {
  onboardingSchema,
  type OnboardingInput,
  type OnboardingValues,
} from "@/lib/validation/account";
import { completeOnboardingAction } from "./actions";
import { toOnboardingFormData } from "./onboarding-payload";

const stepFields: Array<Array<keyof OnboardingValues>> = [
  ["firstName", "lastName", "businessName"],
  ["businessType", "primaryCategory", "experienceLevel"],
  ["countryCode", "defaultCurrency", "sellingMarkets", "sellingChannels"],
  ["locale", "timeZone", "acceptedTerms"],
];

export function OnboardingForm({
  initialFirstName,
  initialLastName,
  initialBusinessName,
  initialAcceptedTerms,
}: {
  initialFirstName: string;
  initialLastName: string;
  initialBusinessName: string;
  initialAcceptedTerms: boolean;
}) {
  const [step, setStep] = useState(0);
  const [state, action] = useActionState(
    completeOnboardingAction,
    initialActionState,
  );
  const [pending, startTransition] = useTransition();
  const form = useForm<OnboardingInput, unknown, OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
      businessName: initialBusinessName,
      businessType: "",
      primaryCategory: "",
      countryCode: "",
      defaultCurrency: "",
      sellingMarkets: [],
      experienceLevel: "",
      sellingChannels: [],
      locale: "",
      timeZone: "",
      acceptedTerms: initialAcceptedTerms,
    },
  });

  useEffect(() => {
    if (!form.getValues("locale") && navigator.language) {
      form.setValue("locale", navigator.language, { shouldValidate: false });
    }
    const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!form.getValues("timeZone") && detectedZone) {
      form.setValue("timeZone", detectedZone, { shouldValidate: false });
    }
  }, [form]);

  const countries = useMemo(
    () =>
      COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    [],
  );
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
  const selectedLocale = form.watch("locale");
  const selectedTimeZone = form.watch("timeZone");
  const fieldError = (field: keyof OnboardingValues) =>
    form.formState.errors[field]?.message ?? state.fieldErrors?.[field]?.[0];

  async function nextStep() {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, 3));
  }

  function submit(values: OnboardingValues) {
    startTransition(() => action(toOnboardingFormData(values)));
  }

  const allErrors = [
    ...Object.values(form.formState.errors)
      .map((error) => error?.message)
      .filter((message): message is string => Boolean(message)),
    ...Object.values(state.fieldErrors ?? {})
      .flat()
      .filter((message): message is string => Boolean(message)),
  ];

  return (
    <div>
      <ol className="mb-9 flex items-center" aria-label="Setup progress">
        {["Identity", "Business", "Markets", "Agreement"].map((label, index) => (
          <li
            key={label}
            className="flex flex-1 items-center last:flex-none"
            aria-current={step === index ? "step" : undefined}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                step >= index
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-faint)]"
              }`}
            >
              {step > index ? <Check className="size-4" /> : index + 1}
            </span>
            {index < 3 ? (
              <span
                className={`mx-2 h-px flex-1 ${
                  step > index ? "bg-[var(--accent)]" : "bg-[var(--line)]"
                }`}
              />
            ) : null}
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ol>

      <form onSubmit={form.handleSubmit(submit)} noValidate>
        {allErrors.length > 0 ? (
          <Alert className="mb-6">
            <p className="font-semibold">Setup needs your attention</p>
            <ul className="mt-1 list-disc pl-4">
              {[...new Set(allErrors)].map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {step === 0 ? (
          <div className="space-y-5">
            <StepHeading
              step="Step 1 of 4"
              title="Tell us who you are"
              description="Your name identifies your account. A business name is optional and can be added later."
            />
            <FormField
              id="firstName"
              label="First name"
              error={fieldError("firstName")}
            >
              <Input
                id="firstName"
                autoComplete="given-name"
                aria-invalid={Boolean(fieldError("firstName"))}
                aria-describedby={
                  fieldError("firstName") ? "firstName-error" : undefined
                }
                {...form.register("firstName")}
              />
            </FormField>
            <FormField
              id="lastName"
              label="Last name"
              error={fieldError("lastName")}
            >
              <Input
                id="lastName"
                autoComplete="family-name"
                aria-invalid={Boolean(fieldError("lastName"))}
                aria-describedby={
                  fieldError("lastName") ? "lastName-error" : undefined
                }
                {...form.register("lastName")}
              />
            </FormField>
            <FormField
              id="businessName"
              label="Business name (optional)"
              description="Leave this blank if you sell under your own name or have not chosen a business name."
              error={fieldError("businessName")}
            >
              <Input
                id="businessName"
                autoComplete="organization"
                placeholder="Northline Resale"
                aria-invalid={Boolean(fieldError("businessName"))}
                aria-describedby={
                  fieldError("businessName")
                    ? "businessName-description businessName-error"
                    : "businessName-description"
                }
                {...form.register("businessName")}
              />
            </FormField>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <StepHeading
              step="Step 2 of 4"
              title="Describe your operation"
              description="These details tailor the workspace to your resale business."
            />
            <FormField
              id="businessType"
              label="Business type"
              error={fieldError("businessType")}
            >
              <Select
                id="businessType"
                aria-invalid={Boolean(fieldError("businessType"))}
                aria-describedby={
                  fieldError("businessType") ? "businessType-error" : undefined
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
              id="primaryCategory"
              label="Primary category"
              error={fieldError("primaryCategory")}
            >
              <Select
                id="primaryCategory"
                aria-invalid={Boolean(fieldError("primaryCategory"))}
                aria-describedby={
                  fieldError("primaryCategory")
                    ? "primaryCategory-error"
                    : undefined
                }
                {...form.register("primaryCategory")}
              >
                <option value="">Choose a primary category</option>
                {PRIMARY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="experienceLevel"
              label="Experience level"
              error={fieldError("experienceLevel")}
            >
              <Select
                id="experienceLevel"
                aria-invalid={Boolean(fieldError("experienceLevel"))}
                aria-describedby={
                  fieldError("experienceLevel")
                    ? "experienceLevel-error"
                    : undefined
                }
                {...form.register("experienceLevel")}
              >
                <option value="">Choose your experience level</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <StepHeading
              step="Step 3 of 4"
              title="Choose where and how you sell"
              description="Your home country sets regional defaults. Selling markets are geographic; selling channels are the platforms or methods you use."
            />
            <FormField
              id="countryCode"
              label="Country"
              error={fieldError("countryCode")}
            >
              <Select
                id="countryCode"
                aria-invalid={Boolean(fieldError("countryCode"))}
                aria-describedby={
                  fieldError("countryCode") ? "countryCode-error" : undefined
                }
                {...form.register("countryCode")}
              >
                <option value="">Choose a country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="defaultCurrency"
              label="Currency"
              error={fieldError("defaultCurrency")}
            >
              <Select
                id="defaultCurrency"
                aria-invalid={Boolean(fieldError("defaultCurrency"))}
                aria-describedby={
                  fieldError("defaultCurrency")
                    ? "defaultCurrency-error"
                    : undefined
                }
                {...form.register("defaultCurrency")}
              >
                <option value="">Choose a currency</option>
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="sellingMarkets"
              label="Selling markets"
              description="Select one or more countries where you currently sell. Hold Ctrl or Command to select several."
              error={fieldError("sellingMarkets")}
            >
              <Select
                id="sellingMarkets"
                multiple
                className="h-36 appearance-auto py-2"
                aria-invalid={Boolean(fieldError("sellingMarkets"))}
                aria-describedby={
                  fieldError("sellingMarkets")
                    ? "sellingMarkets-description sellingMarkets-error"
                    : "sellingMarkets-description"
                }
                {...form.register("sellingMarkets")}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <fieldset
              aria-describedby={
                fieldError("sellingChannels")
                  ? "sellingChannels-description sellingChannels-error"
                  : "sellingChannels-description"
              }
            >
              <legend className="text-sm font-medium text-[var(--ink)]">
                Selling channels
              </legend>
              <p
                id="sellingChannels-description"
                className="mt-1.5 text-xs leading-5 text-[var(--ink-muted)]"
              >
                Choose the platforms or selling methods you use. This is separate
                from the geographic markets above.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SELLING_CHANNELS.map((channel) => (
                  <label
                    key={channel}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm transition hover:bg-[var(--surface-subtle)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--focus-soft)]"
                  >
                    <input
                      type="checkbox"
                      value={channel}
                      className="size-4 accent-[var(--accent)]"
                      {...form.register("sellingChannels")}
                    />
                    <span>{channel}</span>
                  </label>
                ))}
              </div>
              {fieldError("sellingChannels") ? (
                <p
                  id="sellingChannels-error"
                  className="mt-1.5 text-xs text-[var(--danger)]"
                >
                  {fieldError("sellingChannels")}
                </p>
              ) : null}
            </fieldset>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <StepHeading
              step="Step 4 of 4"
              title="Set preferences and review"
              description="Choose how ResellHQ displays regional information, then review the terms for your account."
            />
            <FormField
              id="locale"
              label="Preferred language and locale"
              error={fieldError("locale")}
            >
              <Select
                id="locale"
                aria-invalid={Boolean(fieldError("locale"))}
                aria-describedby={
                  fieldError("locale") ? "locale-error" : undefined
                }
                {...form.register("locale")}
              >
                <option value="">Choose a language</option>
                {Array.from(new Set([selectedLocale, ...LOCALES]))
                  .filter(Boolean)
                  .map((locale) => (
                    <option key={locale} value={locale}>
                      {localeName(locale)} ({locale})
                    </option>
                  ))}
              </Select>
            </FormField>
            <FormField
              id="timeZone"
              label="Time zone"
              error={fieldError("timeZone")}
            >
              <Select
                id="timeZone"
                aria-invalid={Boolean(fieldError("timeZone"))}
                aria-describedby={
                  fieldError("timeZone") ? "timeZone-error" : undefined
                }
                {...form.register("timeZone")}
              >
                <option value="">Choose a time zone</option>
                {Array.from(new Set([selectedTimeZone, ...timeZones]))
                  .filter(Boolean)
                  .map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll("_", " ")}
                  </option>
                  ))}
              </Select>
            </FormField>
            <div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-[var(--line-strong)] bg-[var(--surface)] p-3.5 text-sm leading-6 transition hover:bg-[var(--surface-subtle)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--focus-soft)]">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
                  aria-invalid={Boolean(fieldError("acceptedTerms"))}
                  aria-describedby={
                    fieldError("acceptedTerms")
                      ? "acceptedTerms-error"
                      : undefined
                  }
                  {...form.register("acceptedTerms")}
                />
                <span>
                  I have read and accept the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--accent)] underline underline-offset-4"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--accent)] underline underline-offset-4"
                  >
                    Privacy Notice
                  </Link>
                  .
                </span>
              </label>
              {fieldError("acceptedTerms") ? (
                <p
                  id="acceptedTerms-error"
                  className="mt-1.5 text-xs text-[var(--danger)]"
                >
                  {fieldError("acceptedTerms")}
                </p>
              ) : null}
            </div>
            {state.message ? <Alert>{state.message}</Alert> : null}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between border-t border-[var(--line)] pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || pending}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={nextStep}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? "Creating workspace…" : "Finish setup"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function StepHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="eyebrow">{step}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
        {description}
      </p>
    </div>
  );
}
