"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { toast } from "sonner";

// Load editor only on client side to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
};

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 200 }: Props) {
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  async function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    e.preventDefault();
    setUploading(true);

    try {
      const file = imageItem.getAsFile();
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file, `paste-${Date.now()}.png`);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      const imageMarkdown = `\n![imagen](${url})\n`;
      onChange(value + imageMarkdown);
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      ref={editorRef}
      onPaste={handlePaste}
      className="relative"
      data-color-mode="light"
    >
      {uploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 rounded-md text-sm text-muted-foreground">
          Subiendo imagen…
        </div>
      )}
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={minHeight}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{ placeholder: placeholder ?? "Escribí tus notas en markdown…" }}
      />
    </div>
  );
}
