export interface HelloOptions {
  loud?: boolean;
}

export function hello(name: string, options: HelloOptions = {}): string {
  const base = `Hello, ${name}`;
  return options.loud ? base.toUpperCase() + "!" : base + "!";
}
