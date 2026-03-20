"use client";

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  variant?: "ghost" | "solid";
}

export default function PixelButton({
  children,
  onClick,
  color = "var(--accent)",
  disabled = false,
  className = "",
  type = "button",
  variant = "ghost",
}: PixelButtonProps) {
  const isSolid = variant === "solid";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`pixel-btn text-xs sm:text-sm ${className}`}
      style={{
        borderColor: isSolid ? "transparent" : color,
        color: isSolid ? "#0d0d0d" : color,
        background: isSolid ? color : "transparent",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
