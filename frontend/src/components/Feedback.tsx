import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from 'lucide-react';

export type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

interface FeedbackBannerProps {
  tone?: FeedbackTone;
  title: string;
  message?: string;
  onDismiss?: () => void;
}

const toneStyles: Record<FeedbackTone, { shell: string; icon: string; Icon: typeof Info }> = {
  success: {
    shell: 'bg-green-50 text-green-900 border-green-100',
    icon: 'bg-green-100 text-green-700',
    Icon: CheckCircle2,
  },
  error: {
    shell: 'bg-red-50 text-red-900 border-red-100',
    icon: 'bg-red-100 text-red-700',
    Icon: AlertTriangle,
  },
  warning: {
    shell: 'bg-amber-50 text-amber-900 border-amber-100',
    icon: 'bg-amber-100 text-amber-700',
    Icon: AlertTriangle,
  },
  info: {
    shell: 'bg-blue-50 text-blue-900 border-blue-100',
    icon: 'bg-blue-100 text-blue-700',
    Icon: Info,
  },
};

export const FeedbackBanner = ({
  tone = 'info',
  title,
  message,
  onDismiss,
}: FeedbackBannerProps) => {
  const styles = toneStyles[tone];
  const Icon = styles.Icon;

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 shadow-sm ${styles.shell}`}>
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black">{title}</p>
        {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/70"
          aria-label="Dismiss message"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

interface FeedbackModalProps {
  open: boolean;
  tone?: FeedbackTone;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const FeedbackModal = ({
  open,
  tone = 'info',
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: FeedbackModalProps) => {
  if (!open) return null;

  const styles = toneStyles[tone];
  const Icon = styles.Icon;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onCancel || onConfirm} />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="p-6">
          <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${styles.icon}`}>
            <Icon size={28} />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">{title}</h3>
          {message && <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
          {cancelLabel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-white"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
