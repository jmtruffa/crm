type TemplateVars = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  aumCurrent?: number | null;
  aumEstimated?: number | null;
  [key: string]: string | number | null | undefined;
};

export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    if (value === null || value === undefined) return `{{${key}}}`;
    return String(value);
  });
}
