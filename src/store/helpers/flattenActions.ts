type Bindable = Record<string, unknown>;

export type { Bindable };

function bindMethods<T extends Bindable>(instance: T): T {
  const bound = {} as T;

  for (const key of Reflect.ownKeys(instance) as (keyof T)[]) {
    const value = instance[key];
    bound[key] = (typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(instance) : value) as T[keyof T];
  }

  return bound;
}

export function flattenActions<T extends Bindable>(instances: Bindable[]): T {
  return Object.assign({}, ...instances.map((instance) => bindMethods(instance))) as T;
}
