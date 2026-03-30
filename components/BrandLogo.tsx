type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  size?: BrandLogoSize;
  showText?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

const sizeStyles: Record<BrandLogoSize, { container: string; icon: string; text: string }> = {
  sm: {
    container: "h-8 w-8 rounded-lg",
    icon: "h-4 w-4",
    text: "text-lg",
  },
  md: {
    container: "h-10 w-10 rounded-lg",
    icon: "h-6 w-6",
    text: "text-xl",
  },
  lg: {
    container: "h-12 w-12 rounded-2xl",
    icon: "h-7 w-7",
    text: "text-2xl",
  },
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function BrandLogo({
  size = "md",
  showText = true,
  className,
  iconClassName,
  textClassName,
}: BrandLogoProps) {
  const styles = sizeStyles[size];

  return (
    <div className={joinClasses("flex items-center gap-2", className)}>
      <div
        className={joinClasses(
          "flex items-center justify-center bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-[0_8px_22px_rgba(37,99,235,0.35)]",
          styles.container,
          iconClassName,
        )}
      >
        <svg
          viewBox="0 0 48 48"
          className={styles.icon}
          aria-hidden="true"
          focusable="false"
        >
          <rect x="7" y="11" width="34" height="26" rx="6" fill="rgba(255,255,255,0.16)" />
          <path
            d="M10.5 17.5L24 27.5L37.5 17.5"
            fill="none"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="24" r="2.2" fill="white" />
          <circle cx="32" cy="24" r="2.2" fill="white" />
          <path d="M18.2 24H29.8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {showText ? (
        <span
          className={joinClasses(
            "font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent",
            styles.text,
            textClassName,
          )}
        >
          InboxReveal
        </span>
      ) : null}
    </div>
  );
}