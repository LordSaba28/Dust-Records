import { useEffect, useState } from "react";
import { ImagePlus, Music2 } from "lucide-react";

export function FileWell({
  accept,
  kind,
  label,
  hint,
  file,
  existingUrl,
  onFile,
}: {
  accept: string;
  kind: "image" | "audio";
  label: string;
  hint: string;
  file: File | null;
  existingUrl?: string | null;
  onFile: (file: File | null) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setObjectUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  const preview = objectUrl || existingUrl || null;
  const Icon = kind === "image" ? ImagePlus : Music2;

  return (
    <div className="rounded-card border border-dashed border-line bg-elevated p-4">
      {kind === "image" && preview && (
        <img src={preview} alt="" className="mb-4 aspect-square w-full max-w-56 rounded-md object-cover" />
      )}
      {kind === "audio" && preview && <audio controls src={preview} className="mb-4 w-full" />}
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-line bg-bg px-4 py-6 text-center">
        <Icon size={22} className="text-gold" />
        <span className="mt-3 font-semibold">{file ? file.name : label}</span>
        <span className="mt-1 max-w-xs text-sm text-muted">{hint}</span>
        <span className="mt-4 inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-bg">
          {file || existingUrl ? "Replace file" : "Choose file"}
        </span>
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
