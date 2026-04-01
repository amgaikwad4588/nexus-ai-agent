"use client";

import { motion } from "framer-motion";

interface CreativeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: "emerald" | "yellow" | "purple" | "red";
  size?: "sm" | "md" | "lg";
}

const colorSchemes = {
  emerald: {
    on: "bg-emerald-500",
    glow: "shadow-emerald-500/50",
    pulse: "bg-emerald-500",
  },
  yellow: {
    on: "bg-yellow-500",
    glow: "shadow-yellow-500/50",
    pulse: "bg-yellow-500",
  },
  purple: {
    on: "bg-primary",
    glow: "shadow-primary/50",
    pulse: "bg-primary",
  },
  red: {
    on: "bg-red-500",
    glow: "shadow-red-500/50",
    pulse: "bg-red-500",
  },
};

const sizes = {
  sm: {
    track: "w-9 h-5",
    knob: "w-4 h-4",
    translate: "5.5",
    padding: "mt-0.5",
  },
  md: {
    track: "w-11 h-6",
    knob: "w-5 h-5",
    translate: "6.5",
    padding: "mt-0.5",
  },
  lg: {
    track: "w-14 h-7",
    knob: "w-6 h-6",
    translate: "8",
    padding: "mt-0.5",
  },
};

export function CreativeToggle({
  checked,
  onChange,
  disabled = false,
  color = "emerald",
  size = "md",
}: CreativeToggleProps) {
  const scheme = colorSchemes[color];
  const s = sizes[size];

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "" : "hover:opacity-80"
      }`}
      aria-label={checked ? "Toggle off" : "Toggle on"}
    >
      <div className="relative">
        <div
          className={`
            ${s.track} rounded-full transition-all duration-300 relative overflow-hidden
            ${checked ? scheme.on : "bg-zinc-700/60 hover:bg-zinc-600"}
            ${checked ? `shadow-lg ${scheme.glow} shadow-[0_0_15px_-3px]` : ""}
          `}
        >
          {checked && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer" />
          )}
          <motion.div
            initial={false}
            animate={{
              x: checked ? parseInt(s.translate.replace(".", "")) * 0.5 + 4 : 4,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            className={`${s.knob} rounded-full bg-white shadow-lg ${s.padding} relative z-10`}
          >
            {checked && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"
                />
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute -inset-1 rounded-full ${scheme.pulse}/20 blur-sm`}
                />
              </>
            )}
          </motion.div>
        </div>
        
        {checked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute -inset-1 rounded-full ${scheme.pulse}/10 blur-md -z-10`}
          />
        )}
      </div>
    </button>
  );
}
