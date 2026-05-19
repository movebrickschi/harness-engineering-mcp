import Handlebars from "handlebars";

Handlebars.registerHelper("ifEquals", function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
  return a === b ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("upper", (s: string) => (typeof s === "string" ? s.toUpperCase() : s));
Handlebars.registerHelper("lower", (s: string) => (typeof s === "string" ? s.toLowerCase() : s));
Handlebars.registerHelper("json", (ctx: unknown) => JSON.stringify(ctx, null, 2));

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template, { noEscape: true });
  return compiled(data);
}

export { Handlebars };
