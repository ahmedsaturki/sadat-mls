"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { fadeUpVariant } from "@/lib/utils/animations";

interface LuxuryStatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "orange";
}

const colorConfig = {
  blue: {
    bg: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20 group-hover:border-blue-500/50",
    iconBg: "bg-blue-500/10 text-blue-600",
    glow: "group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]",
  },
  green: {
    bg: "from-green-500/10 to-green-500/5",
    border: "border-green-500/20 group-hover:border-green-500/50",
    iconBg: "bg-green-500/10 text-green-600",
    glow: "group-hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/20 group-hover:border-purple-500/50",
    iconBg: "bg-purple-500/10 text-purple-600",
    glow: "group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]",
  },
  orange: {
    bg: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/20 group-hover:border-orange-500/50",
    iconBg: "bg-orange-500/10 text-orange-600",
    glow: "group-hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]",
  },
};

const LuxuryStatCard = memo(function LuxuryStatCard({
  icon: Icon,
  label,
  value,
  color,
}: LuxuryStatCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      variants={fadeUpVariant}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} p-6 transition-all duration-300 ${config.glow}`}
    >
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl group-hover:bg-white/40 transition-colors duration-500" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold font-serif text-[#1B2D4F] drop-shadow-sm">
            {value.toLocaleString()}
          </p>
        </div>
        
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl backdrop-blur-md shadow-sm ${config.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className="h-7 w-7 drop-shadow-sm" />
        </div>
      </div>
      
      {/* Bottom glowing line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-transparent via-[#C49A2A] to-transparent group-hover:w-full transition-all duration-700 ease-out opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
});

export default LuxuryStatCard;
