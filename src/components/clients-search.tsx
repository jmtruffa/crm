"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useTransition } from "react";
import { CLIENT_STATUS } from "@/lib/constants";
import { Search } from "lucide-react";

export function ClientsSearch({
  defaultSearch,
  defaultStatus,
}: {
  defaultSearch: string;
  defaultStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const updateParams = useCallback(
    (search: string, status: string) => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status && status !== "ALL") params.set("status", status);
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname]
  );

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email, DNI, CUIT…"
          defaultValue={defaultSearch}
          className="pl-9"
          onChange={(e) => updateParams(e.target.value, defaultStatus)}
        />
      </div>
      <Select
        defaultValue={defaultStatus || "ALL"}
        onValueChange={(val) => updateParams(defaultSearch, val)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          {Object.entries(CLIENT_STATUS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
