import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateDialog } from "@/components/template-dialog";
import { DeleteTemplateButton } from "@/components/delete-template-button";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Plantillas de mensajes con variables dinámicas
          </p>
        </div>
        <TemplateDialog />
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay templates. Creá el primero usando el botón de arriba.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const variables = template.variables ? JSON.parse(template.variables) : [];
            return (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                      {template.subject && (
                        <p className="text-xs text-muted-foreground mt-1">Asunto: {template.subject}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TemplateDialog template={template} />
                      <DeleteTemplateButton templateId={template.id} templateName={template.name} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {template.body}
                  </p>
                  {variables.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {variables.map((v: string) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
