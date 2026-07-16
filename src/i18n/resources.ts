import { parse } from 'yaml';

type LocaleResources = Record<string, Record<string, object>>;

const localeModules = import.meta.glob('../../locales/*/*.yaml', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const localePathPattern = /locales\/([^/]+)\/([^/]+)\.yaml$/;

export function loadLocaleResources(): LocaleResources {
  const resources: LocaleResources = {};

  for (const [path, content] of Object.entries(localeModules)) {
    const match = path.match(localePathPattern);
    if (!match) continue;

    const [, locale, namespace] = match;
    resources[locale] ??= {};
    resources[locale][namespace] = parse(content) as object;
  }

  return resources;
}
