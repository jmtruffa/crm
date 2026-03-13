"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  CLIENT_STATUS,
  RISK_PROFILE,
  COMMERCIAL_SUBSTATE,
  SOURCE_CHANNEL,
  OBJECTION_CODE,
} from "@/lib/constants";

type ClientFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  dob: string;
  street: string;
  streetNumber: string;
  apt: string;
  city: string;
  postalCode: string;
  country: string;
  document: string;
  cuit: string;
  status: string;
  riskProfile: string;
  origin: string;
  notes: string;
  // Commercial
  commercialSubstate: string;
  aumCurrent: string;
  aumEstimated: string;
  lastOperationAt: string;
  lastFundingAt: string;
  sourceChannel: string;
  objectionCode: string;
};

const defaults: ClientFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  dob: "",
  street: "",
  streetNumber: "",
  apt: "",
  city: "",
  postalCode: "",
  country: "Argentina",
  document: "",
  cuit: "",
  status: "PROSPECT",
  riskProfile: "",
  origin: "",
  notes: "",
  commercialSubstate: "",
  aumCurrent: "",
  aumEstimated: "",
  lastOperationAt: "",
  lastFundingAt: "",
  sourceChannel: "",
  objectionCode: "",
};

type Props = {
  initialData?: Partial<ClientFormData> & { id?: number };
};

export function ClientForm({ initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState<ClientFormData>({ ...defaults, ...initialData });
  const [loading, setLoading] = useState(false);

  const set = (field: keyof ClientFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setSelect = (field: keyof ClientFormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => {
        if (v === "") return [k, null];
        // Convert numeric fields
        if (k === "aumCurrent" || k === "aumEstimated") return [k, v ? Number(v) : null];
        return [k, v];
      })
    );

    try {
      const res = await fetch(
        isEdit ? `/api/clients/${initialData!.id}` : "/api/clients",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      const client = await res.json();

      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch {
      toast.error("Ocurrió un error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Datos personales */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Datos personales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre *</Label>
            <Input id="firstName" value={form.firstName} onChange={set("firstName")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido *</Label>
            <Input id="lastName" value={form.lastName} onChange={set("lastName")} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+54 11 1234-5678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={form.company} onChange={set("company")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Fecha de nacimiento</Label>
            <Input id="dob" type="date" value={form.dob} onChange={set("dob")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document">DNI / Pasaporte</Label>
            <Input id="document" value={form.document} onChange={set("document")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input id="cuit" value={form.cuit} onChange={set("cuit")} placeholder="20-12345678-9" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Domicilio */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Domicilio</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="street">Calle</Label>
            <Input id="street" value={form.street} onChange={set("street")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="streetNumber">Número</Label>
            <Input id="streetNumber" value={form.streetNumber} onChange={set("streetNumber")} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="apt">Piso / Dpto / Oficina</Label>
            <Input id="apt" value={form.apt} onChange={set("apt")} placeholder="3° B, Oficina 12…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={form.city} onChange={set("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input id="postalCode" value={form.postalCode} onChange={set("postalCode")} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="country">País</Label>
            <Input id="country" value={form.country} onChange={set("country")} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Estado CRM */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Información CRM</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={setSelect("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CLIENT_STATUS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Perfil de Riesgo</Label>
            <Select
              value={form.riskProfile || "NONE"}
              onValueChange={(v) => setSelect("riskProfile")(v === "NONE" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin definir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin definir</SelectItem>
                {Object.entries(RISK_PROFILE).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="origin">Origen (cómo llegó)</Label>
            <Input id="origin" value={form.origin} onChange={set("origin")} placeholder="Referido por…, LinkedIn, etc." />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="notes">Notas generales</Label>
            <Textarea id="notes" value={form.notes} onChange={set("notes")} rows={3} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Datos Comerciales */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Datos Comerciales</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Subestado comercial</Label>
            <Select
              value={form.commercialSubstate || "NONE"}
              onValueChange={(v) => setSelect("commercialSubstate")(v === "NONE" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin definir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin definir</SelectItem>
                {Object.entries(COMMERCIAL_SUBSTATE).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Canal de origen</Label>
            <Select
              value={form.sourceChannel || "NONE"}
              onValueChange={(v) => setSelect("sourceChannel")(v === "NONE" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin definir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin definir</SelectItem>
                {Object.entries(SOURCE_CHANNEL).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aumCurrent">AUM actual (USD)</Label>
            <Input
              id="aumCurrent"
              type="number"
              min="0"
              step="1000"
              value={form.aumCurrent}
              onChange={set("aumCurrent")}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aumEstimated">AUM estimado (USD)</Label>
            <Input
              id="aumEstimated"
              type="number"
              min="0"
              step="1000"
              value={form.aumEstimated}
              onChange={set("aumEstimated")}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastOperationAt">Última operación</Label>
            <Input
              id="lastOperationAt"
              type="date"
              value={form.lastOperationAt}
              onChange={set("lastOperationAt")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastFundingAt">Última acreditación</Label>
            <Input
              id="lastFundingAt"
              type="date"
              value={form.lastFundingAt}
              onChange={set("lastFundingAt")}
            />
          </div>
          <div className="space-y-2">
            <Label>Objeción</Label>
            <Select
              value={form.objectionCode || "NONE"}
              onValueChange={(v) => setSelect("objectionCode")(v === "NONE" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin definir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin definir</SelectItem>
                {Object.entries(OBJECTION_CODE).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cliente"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
