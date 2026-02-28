"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { INTERACTION_TYPE } from "@/lib/constants";
import { Search, X } from "lucide-react";

type Client = { id: number; firstName: string; lastName: string };

type Props = {
  clients: Client[];
  defaultSearch: string;
  defaultClientId: string;
  defaultType: string;
  defaultDateFrom: string;
  defaultDateTo: string;
};

export function InteractionsFilter({
  clients,
  defaultSearch,
  defaultClientId,
  defaultType,
  defaultDateFrom,
  defaultDateTo,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const push = useCallback(
    (overrides: Record<string, string>) => {
      const current = {
        search: defaultSearch,
        clientId: defaultClientId,
        type: defaultType,
        dateFrom: defaultDateFrom,
        dateTo: defaultDateTo,
        ...overrides,
      };
      const params = new URLSearchParams();
      Object.entries(current).forEach(([k, v]) => {
        if (v && v !== "ALL") params.set(k, v);
      });
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [defaultSearch, defaultClientId, defaultType, defaultDateFrom, defaultDateTo, router, pathname]
  );

  const hasFilters = defaultSearch || defaultClientId || defaultType || defaultDateFrom || defaultDateTo;

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  return (
    <div className="space-y-3 rounded-md border p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Filtros</span>
        {hasFilters && (
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={clearAll}>
            <X className="h-3 w-3 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Búsqueda de texto */}
        <div className="space-y-1 lg:col-span-1">
          <Label className="text-xs">Buscar en notas</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Texto libre…"
              defaultValue={defaultSearch}
              className="pl-8 h-8 text-sm"
              onChange={(e) => push({ search: e.target.value })}
            />
          </div>
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <Label className="text-xs">Cliente</Label>
          <Select
            defaultValue={defaultClientId || "ALL"}
            onValueChange={(v) => push({ clientId: v === "ALL" ? "" : v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.lastName}, {c.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tipo */}
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select
            defaultValue={defaultType || "ALL"}
            onValueChange={(v) => push({ type: v === "ALL" ? "" : v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {Object.entries(INTERACTION_TYPE).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha desde */}
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input
            type="date"
            defaultValue={defaultDateFrom}
            className="h-8 text-sm"
            onChange={(e) => push({ dateFrom: e.target.value })}
          />
        </div>

        {/* Fecha hasta */}
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input
            type="date"
            defaultValue={defaultDateTo}
            className="h-8 text-sm"
            onChange={(e) => push({ dateTo: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
