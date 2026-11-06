import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  value,
  onChange,
  autoComplete,
  showRules = false,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  showRules?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const longEnough = value.length >= 8;

  return (
    <div>
      <div className="relative">
        <input
          required
          minLength={showRules ? 8 : undefined}
          autoComplete={autoComplete}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-elevated py-3 pl-3 pr-14 outline-none focus:border-gold"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-1 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-muted"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showRules && (
        <p className={`mt-2 text-sm ${longEnough ? "text-gold-soft" : "text-muted"}`}>
          {longEnough ? "Long enough." : "At least 8 characters."}
        </p>
      )}
    </div>
  );
}
