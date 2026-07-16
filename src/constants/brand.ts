/** 品牌 Seed 色，antd / tailwind 共用。修改后执行 pnpm theme:sync */
export const BrandSeed = {
  Primary: '#697eff',
  Success: '#52c41a',
  Error: '#ff4d4f',
  Warning: '#faad14',
} as const;

export type BrandSeedColor = (typeof BrandSeed)[keyof typeof BrandSeed];

export type BrandColorKey = keyof typeof BrandSeed;

export type BrandColors = Record<BrandColorKey, string>;

export type BrandColorPatch = Partial<BrandColors>;

export const defaultBrandColors: BrandColors = { ...BrandSeed };
