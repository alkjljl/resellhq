export function countryName(code: string, locale = "en") {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function localeName(locale: string, displayLocale = "en") {
  try {
    return (
      new Intl.DisplayNames([displayLocale], { type: "language" }).of(locale) ??
      locale
    );
  } catch {
    return locale;
  }
}

export function formatTimeZone(timeZone: string) {
  return timeZone.replaceAll("_", " ");
}
