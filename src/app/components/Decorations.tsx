// Decorative visual components for 智农规划
// These add visual richness without requiring image files

interface DecorProps {
  className?: string;
}

// Animated gradient orb for hero sections
export function GradientOrb({ className = "" }: DecorProps) {
  return (
    <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse-slow pointer-events-none ${className}`} />
  );
}

// Section divider with icon
export function SectionDivider({ className = "" }: DecorProps) {
  return (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      <span className="text-stone-300">✦</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
    </div>
  );
}

// Empty state illustration (no data placeholder)
export function EmptyState({ message = "暂无数据", icon = "📋" }: { message?: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-stone-400">
      <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-3xl mb-4 animate-float">
        {icon}
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// Loading skeleton for content placeholders
export function Skeleton({ className = "" }: DecorProps) {
  return (
    <div className={`bg-stone-200 rounded-xl animate-shimmer ${className}`} />
  );
}

// Status badge component
export function StatusBadge({ status, label }: { status: "success" | "warning" | "error" | "info"; label: string }) {
  const styles = {
    success: "bg-green-100 text-green-700 border-green-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-red-100 text-red-700 border-red-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
  };
  const icons = {
    success: "✓",
    warning: "!",
    error: "✕",
    info: "i",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/60">{icons[status]}</span>
      {label}
    </span>
  );
}

// Progress ring (circular progress indicator)
export function ProgressRing({ progress, size = 60, strokeWidth = 4, color = "#22c55e" }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

// Animated counter number display
export function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  return (
    <span className="tabular-nums animate-count-up inline-block">
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

// Tooltip component
export function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-stone-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-stone-800" />
      </div>
    </div>
  );
}

// Decorative wave pattern for section backgrounds
export function WavePattern({ className = "" }: DecorProps) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-8">
        <path d="M0,60 C200,100 400,20 600,60 C800,100 1000,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" opacity="0.05" />
        <path d="M0,80 C300,40 500,100 700,60 C900,20 1100,80 1200,60 L1200,120 L0,120 Z" fill="currentColor" opacity="0.03" />
      </svg>
    </div>
  );
}

// Dot grid pattern background
export function DotGrid({ className = "" }: DecorProps) {
  return (
    <div className={`pointer-events-none ${className}`} style={{
      backgroundImage: "radial-gradient(circle, #d6d3d1 1px, transparent 1px)",
      backgroundSize: "20px 20px"
    }} />
  );
}

// Interactive card wrapper with hover lift effect
export function InteractiveCard({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 shadow-sm border border-stone-100 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </Component>
  );
}

// Tag/chip component
export function Tag({ children, active = false, onClick, color = "green" }: { children: React.ReactNode; active?: boolean; onClick?: () => void; color?: "green" | "blue" | "amber" | "red" | "purple" }) {
  const colors = {
    green: active ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border-green-200",
    blue: active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 border-blue-200",
    amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border-amber-200",
    red: active ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border-red-200",
    purple: active ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 border-purple-200",
  };
  const Component = onClick ? "button" : "span";
  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${colors[color]} ${onClick ? "cursor-pointer hover:shadow-sm active:scale-95" : ""}`}
    >
      {children}
    </Component>
  );
}

// Notification dot indicator
export function NotificationDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-blink">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Section header with icon and optional action button
export function SectionHeader({ icon, title, action, actionLabel }: { icon: string; title: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        {title}
      </h3>
      {action && actionLabel && (
        <button onClick={action} className="text-xs text-green-600 font-medium hover:text-green-700 cursor-pointer flex items-center gap-0.5 active:scale-95 transition-all duration-200">
          {actionLabel} <span className="text-sm">›</span>
        </button>
      )}
    </div>
  );
}

// Feature card with icon for quick actions
export function FeatureCard({ icon, label, description, onClick, gradient = "from-green-500 to-green-600" }: { icon: string; label: string; description: string; onClick: () => void; gradient?: string }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer text-left`}
    >
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] opacity-80 mt-0.5">{description}</p>
    </button>
  );
}

// Data display card with label and value
export function DataCard({ icon, label, value, trend, color = "green" }: { icon: string; label: string; value: string; trend?: "up" | "down" | "stable"; color?: "green" | "blue" | "amber" | "red" }) {
  const gradients = {
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    amber: "from-amber-500 to-amber-600",
    red: "from-red-500 to-red-600",
  };
  return (
    <div className={`bg-gradient-to-br ${gradients[color]} rounded-2xl p-4 text-center text-white shadow-sm`}>
      <span className="text-xl block mb-1">{icon}</span>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] opacity-80 mt-0.5">{label}</p>
      {trend && (
        <span className="text-[10px] mt-1 block">
          {trend === "up" ? "↑ 上涨" : trend === "down" ? "↓ 下跌" : "→ 持平"}
        </span>
      )}
    </div>
  );
}
