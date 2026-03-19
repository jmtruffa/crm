"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function ClientQuickSearch() {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("search") as HTMLInputElement;
    const val = input.value.trim();
    if (val) router.push(`/clients?search=${encodeURIComponent(val)}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          name="search"
          className="pl-8 w-64"
          placeholder="Buscar cliente… (Enter)"
        />
      </div>
    </form>
  );
}
