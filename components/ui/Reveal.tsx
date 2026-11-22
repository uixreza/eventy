"use client";

import { motion } from "framer-motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra delay in seconds before the reveal starts. */
  delay?: number;
  /** Distance (px) the content slides up from. */
  distance?: number;
};

/** Fades + slides its children in once they scroll into view. */
export default function Reveal({ children, className, delay = 0, distance = 28 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
