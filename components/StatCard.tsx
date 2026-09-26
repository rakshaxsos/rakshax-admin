export default function StatCard({
  label,
  value,
  alert = false,
  subtitle,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  alert?: boolean;
  subtitle?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
}) {
  const getVariantStyles = () => {
    if (alert || variant === 'danger') {
      return {
        border: 'border-red-500/40',
        text: 'text-red-400',
        bg: 'bg-red-950/20',
        badge: 'bg-red-500/20 text-red-300',
      };
    }
    if (variant === 'success') {
      return {
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/20',
        badge: 'bg-emerald-500/20 text-emerald-300',
      };
    }
    if (variant === 'warning') {
      return {
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        bg: 'bg-amber-950/20',
        badge: 'bg-amber-500/20 text-amber-300',
      };
    }
    if (variant === 'info') {
      return {
        border: 'border-blue-500/40',
        text: 'text-blue-400',
        bg: 'bg-blue-950/20',
        badge: 'bg-blue-500/20 text-blue-300',
      };
    }
    return {
      border: 'border-slate-800',
      text: 'text-slate-100',
      bg: 'bg-[#111C30]',
      badge: 'bg-slate-800 text-slate-400',
    };
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`rounded-xl border ${styles.border} ${styles.bg} p-4 transition-all hover:border-slate-700 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        {alert && (
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
        )}
      </div>
      <div className={`mt-2 text-2xl font-black tracking-tight ${styles.text}`}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-400">{subtitle}</div>
      )}
    </div>
  );
}
