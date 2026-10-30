"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, FileText, ImageUp, LoaderCircle, X } from "lucide-react";

const MAX_LADO = 1600;
const MAX_BYTES = 5 * 1024 * 1024;

// Reduce fotos grandes del celular a JPEG de máx. 1600 px antes de subirlas.
async function comprimir(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/heic" || file.type === "image/heif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export type VoucherValue = { file: File | null; quitar: boolean };

export function VoucherInput({
  existente,
  value,
  onChange,
}: {
  existente?: { url: string; tipo: string | null } | null;
  value: VoucherValue;
  onChange: (value: VoucherValue) => void;
}) {
  const camaraRef = useRef<HTMLInputElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(
    () => (value.file?.type.startsWith("image/") ? URL.createObjectURL(value.file) : null),
    [value.file],
  );
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function elegir(files: FileList | null) {
    const original = files?.[0];
    if (!original) return;
    setError(null);
    setProcesando(true);
    const file = await comprimir(original);
    setProcesando(false);
    if (file.size > MAX_BYTES) {
      setError("El archivo pesa más de 5 MB. Elige uno más liviano.");
      return;
    }
    onChange({ file, quitar: false });
  }

  const mostrarExistente = existente && !value.file && !value.quitar;

  return (
    <div className="flex flex-col gap-2">
      {/* capture="environment" abre directamente la cámara trasera en el celular. */}
      <input
        ref={camaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          elegir(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={archivoRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          elegir(e.target.files);
          e.target.value = "";
        }}
      />

      {value.file || mostrarExistente ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
            <img src={preview} alt="Vista previa del voucher" className="size-16 shrink-0 rounded-lg object-cover" />
          ) : mostrarExistente && existente.tipo?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal de S3
            <img src={existente.url} alt="Voucher actual" className="size-16 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
              <FileText className="size-7" aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium">{value.file ? value.file.name : "Voucher actual"}</p>
            <p className="text-xs text-muted">
              {value.file ? `${Math.max(1, Math.round(value.file.size / 1024))} KB` : "Ya guardado"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ file: null, quitar: Boolean(existente) })}
            aria-label="Quitar voucher"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface-muted hover:text-danger"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => camaraRef.current?.click()}
            disabled={procesando}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-sm active:scale-[0.98]"
          >
            {procesando ? <LoaderCircle className="size-6 animate-spin text-muted" aria-hidden /> : <Camera className="size-6 text-muted" aria-hidden />}
            Tomar foto
          </button>
          <button
            type="button"
            onClick={() => archivoRef.current?.click()}
            disabled={procesando}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-sm active:scale-[0.98]"
          >
            <ImageUp className="size-6 text-muted" aria-hidden />
            Galería o PDF
          </button>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
