import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { antdDarkTokens, antdLightTokens } from './antd-theme.ts';

const __dirname = import.meta.dirname;

type AntdTokens = typeof antdLightTokens;

function normalizeCssValue(value: string | number | boolean) {
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
  return String(value);
}

function toColorVarName(tokenName: string) {
  const kebab = tokenName
    .replace(/^color/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  return `--color-${kebab}`;
}

function toShadowVarName(tokenName: string) {
  const suffix = tokenName.slice('boxShadow'.length);
  if (!suffix) return '--shadow';
  const kebab = suffix
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
  return `--shadow-${kebab}`;
}

function toMotionDurationVarName(tokenName: string) {
  const suffix = tokenName.slice('motionDuration'.length);
  return `--duration-${suffix.toLowerCase()}`;
}

function toMotionEaseVarName(tokenName: string) {
  const suffix = tokenName.slice('motionEase'.length);
  const kebab = suffix
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
  return `--ease-${kebab}`;
}

const semanticAliases = {
  '--color-background': 'colorBgContainer',
  '--color-foreground': 'colorText',
  '--color-primary': 'colorPrimary',
  '--color-primary-foreground': 'colorTextLightSolid',
  '--color-secondary': 'colorFillQuaternary',
  '--color-secondary-foreground': 'colorText',
  '--color-muted': 'colorFillQuaternary',
  '--color-muted-foreground': 'colorTextSecondary',
  '--color-accent': 'colorFillTertiary',
  '--color-accent-foreground': 'colorText',
  '--color-destructive': 'colorError',
  '--color-destructive-foreground': 'colorTextLightSolid',
  '--color-border': 'colorBorder',
  '--color-ring': 'colorPrimary',
  '--color-ring-offset': 'colorBgContainer',
  '--color-card': 'colorBgContainer',
  '--color-card-foreground': 'colorText',
  '--color-success': 'colorSuccess',
  '--color-warning': 'colorWarning',
  '--color-error': 'colorError',
  '--color-info': 'colorInfo',
  '--color-link': 'colorLink',
  '--color-mask': 'colorBgMask',
} as const;

const palettePrefixes = ['colorPrimary', 'colorSuccess', 'colorError', 'colorWarning', 'colorInfo'];

function collectTokens(tokens: AntdTokens, prefix: string) {
  return Object.keys(tokens)
    .filter((key) => key.startsWith(prefix))
    .sort();
}

function formatVars(tokens: AntdTokens) {
  const lines: string[] = [];
  const usedTokenNames = new Set<string>(Object.values(semanticAliases));

  for (const [cssVar, tokenName] of Object.entries(semanticAliases)) {
    const value = tokens[tokenName];
    if (value != null) lines.push(`  ${cssVar}: ${normalizeCssValue(value)};`);
  }

  for (const tokenName of collectTokens(tokens, 'color')) {
    if (!palettePrefixes.some((prefix) => tokenName.startsWith(prefix))) continue;
    if (usedTokenNames.has(tokenName)) continue;

    lines.push(`  ${toColorVarName(tokenName)}: ${normalizeCssValue(tokens[tokenName as keyof AntdTokens] as string)};`);
    usedTokenNames.add(tokenName);
  }

  for (const tokenName of collectTokens(tokens, 'boxShadow')) {
    lines.push(`  ${toShadowVarName(tokenName)}: ${normalizeCssValue(tokens[tokenName as keyof AntdTokens] as string)};`);
  }

  for (const tokenName of collectTokens(tokens, 'motionDuration')) {
    lines.push(`  ${toMotionDurationVarName(tokenName)}: ${normalizeCssValue(tokens[tokenName as keyof AntdTokens] as string)};`);
  }

  for (const tokenName of collectTokens(tokens, 'motionEase')) {
    lines.push(`  ${toMotionEaseVarName(tokenName)}: ${normalizeCssValue(tokens[tokenName as keyof AntdTokens] as string)};`);
  }

  if (tokens.motionUnit != null) {
    lines.push(`  --motion-unit: ${tokens.motionUnit};`);
  }

  if (tokens.motionBase != null) {
    lines.push(`  --motion-base: ${tokens.motionBase};`);
  }

  lines.push(`  --default-transition-duration: ${tokens.motionDurationMid};`);
  lines.push(`  --default-transition-timing-function: ${tokens.motionEaseInOut};`);

  lines.push(`  --radius-sm: ${tokens.borderRadiusSM}px;`);
  lines.push(`  --radius-md: ${tokens.borderRadius}px;`);
  lines.push(`  --radius-lg: ${tokens.borderRadiusLG}px;`);
  lines.push(`  --radius-xl: ${Number(tokens.borderRadiusLG) + 4}px;`);

  return lines.join('\n');
}

export function writeAntdTokensCss() {
  const output = `/* 由 scripts/generate-antd-tailwind-theme.ts 生成，请勿手动编辑 */
/* 修改 src/constants/brand.ts 中 BrandSeed 后执行: pnpm theme:sync */

@theme {
${formatVars(antdLightTokens)}
}

.dark {
${formatVars(antdDarkTokens)}
}
`;

  const outPath = path.join(__dirname, 'antd-tokens.css');
  writeFileSync(outPath, output, 'utf8');
  console.log(`Wrote ${outPath}`);
}
