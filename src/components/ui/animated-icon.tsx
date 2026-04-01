"use client";

import { motion } from "framer-motion";
import { ComponentType } from "react";

type AnimationType = "bounce" | "pulse" | "wiggle" | "rotate" | "float";

interface AnimatedIconProps {
  icon: ComponentType<{ className?: string }>;
  animation?: AnimationType;
  hoverOnly?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export function AnimatedIcon({
  icon: Icon,
  animation = "bounce",
  hoverOnly = true,
  size = "md",
  color,
  className = "",
}: AnimatedIconProps) {
  const commonProps = {
    className: `inline-flex items-center justify-center ${color || ""} ${className}`,
  };

  if (animation === "bounce") {
    return (
      <motion.span
        {...commonProps}
        whileHover={{ y: [-2, 0, -4, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.5 }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className={sizeClasses[size]} />
      </motion.span>
    );
  }

  if (animation === "pulse") {
    return (
      <motion.span
        {...commonProps}
        animate={hoverOnly ? undefined : { scale: [1, 1.15, 1] }}
        whileHover={hoverOnly ? { scale: [1, 1.15, 1] } : undefined}
        transition={{ duration: 0.6, repeat: Infinity }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className={sizeClasses[size]} />
      </motion.span>
    );
  }

  if (animation === "wiggle") {
    return (
      <motion.span
        {...commonProps}
        animate={hoverOnly ? undefined : { rotate: [-8, 8, -8] }}
        whileHover={hoverOnly ? { rotate: [-8, 8, -8] } : undefined}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className={sizeClasses[size]} />
      </motion.span>
    );
  }

  if (animation === "rotate") {
    return (
      <motion.span
        {...commonProps}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className={sizeClasses[size]} />
      </motion.span>
    );
  }

  if (animation === "float") {
    return (
      <motion.span
        {...commonProps}
        animate={hoverOnly ? undefined : { y: [0, -4, 0] }}
        whileHover={hoverOnly ? { y: [0, -4, 0] } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className={sizeClasses[size]} />
      </motion.span>
    );
  }

  return (
    <motion.span {...commonProps} whileTap={{ scale: 0.9 }}>
      <Icon className={sizeClasses[size]} />
    </motion.span>
  );
}

export function GlowIcon({
  icon: Icon,
  size = "md",
  color = "text-primary",
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}) {
  return (
    <motion.span
      className={`inline-flex items-center justify-center ${color} ${className}`}
      animate={{ 
        opacity: [0.6, 1, 0.6],
        filter: ["drop-shadow(0 0 2px currentColor)", "drop-shadow(0 0 8px currentColor)", "drop-shadow(0 0 2px currentColor)"]
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <Icon className={sizeClasses[size]} />
    </motion.span>
  );
}
