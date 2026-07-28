"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
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
  FALLBACK_CURRENCIES,
  FALLBACK_TIME_ZONES,
  LOCALES,
} from "@/lib/constants/international";
import { countryName, localeName } from "@/lib/formatting/international";
import {
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/validation/account";
import { completeOnboardingAction } from "./actions";

const stepFields: Array<Array<keyof OnboardingValues>> = [
  ["displayName", "workspaceName"],
  ["businessType", "countryCode"],
  ["defaultCurrency", "locale", "timeZone"],
];

export function OnboardingForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const [step, setStep] = useState(0);
  const [state, action] = useActionState(
    completeOnboardingAction,
    initialActionState,
  );
  const [pending, startTransition] = useTransition();
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: initialDisplayName,
      workspaceName: "",
      businessType: "",
      countryCode: "",
      defaultCurrency: "",
      locale: "",
      timeZone: "",
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

  async function nextStep() {
    const valid = await form.trigger(stepFields[step], { shouldFocus: true });
    if (valid) setStep((current) => Math.min(current + 1, 2));
  }

  function submit(values: OnboardingValues) {
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => data.set(key, value ?? ""));
    startTransition(() => action(data));
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
        {["Identity", "Business", "Preferences"].map((label, index) => (
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
            {index < 2 ? (
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
              step="Step 1 of 3"
              title="Start with the essentials"
              description="This is how your name and workspace will appear throughout ResellHQ."
            />
            <FormField
              id="displayName"
              label="Display name"
              error={form.formState.errors.displayName?.message}
            >
              <Input
                id="displayName"
                autoComplete="name"
                aria-invalid={Boolean(form.formState.errors.displayName)}
                {...form.register("displayName")}
              />
            </FormField>
            <FormField
              id="workspaceName"
              label="Workspace or store name"
              description="You can change this later."
              error={form.formState.errors.workspaceName?.message}
            >
              <Input
                id="workspaceName"
                autoComplete="organization"
                placeholder="Northline Resale"
                aria-invalid={Boolean(form.formState.errors.workspaceName)}
                {...form.register("workspaceName")}
              />
            </FormField>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <StepHeading
              step="Step 2 of 3"
              title="Describe your operation"
              description="Business type is optional. Country prepares appropriate regional defaults."
            />
            <FormField
              id="businessType"
              label="Business type"
              error={form.formState.errors.businessType?.message}
            >
              <Select
                id="businessType"
                aria-invalid={Boolean(form.formState.errors.businessType)}
                {...form.register("businessType")}
              >
                <option value="">Not specified</option>
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
              error={form.formState.errors.countryCode?.message}
            >
              <Select
                id="countryCode"
                aria-invalid={Boolean(form.formState.errors.countryCode)}
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
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <StepHeading
              step="Step 3 of 3"
              title="Set regional preferences"
              description="These settings control how future records will be displayed."
            />
            <FormField
              id="defaultCurrency"
              label="Default currency"
              error={form.formState.errors.defaultCurrency?.message}
            >
              <Select
                id="defaultCurrency"
                aria-invalid={Boolean(form.formState.errors.defaultCurrency)}
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
              id="locale"
              label="Preferred language and locale"
              error={form.formState.errors.locale?.message}
            >
              <Select
                id="locale"
                aria-invalid={Boolean(form.formState.errors.locale)}
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
              error={form.formState.errors.timeZone?.message}
            >
              <Select
                id="timeZone"
                aria-invalid={Boolean(form.formState.errors.timeZone)}
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
          {step < 2 ? (
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
