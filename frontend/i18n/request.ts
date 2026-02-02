import { getRequestConfig } from "next-intl/server";

const locales = ["en", "th"] as const;

type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = locales.includes(requestLocale as Locale)
    ? (requestLocale as Locale)
    : "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
