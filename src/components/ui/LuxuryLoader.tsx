"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface LuxuryLoaderProps {
  fullScreen?: boolean;
  text?: string;
}

export function LuxuryLoader({ fullScreen = false, text = "Loading..." }: LuxuryLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full p-8 ${fullScreen ? "min-h-screen bg-gray-50" : "min-h-[400px]"}`}>
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="w-16 h-16 rounded-full bg-[#1B2D4F]/10 flex items-center justify-center mb-6 relative"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#C49A2A] opacity-70"
        />
        <Sparkles className="w-6 h-6 text-[#1B2D4F]" />
      </motion.div>
      
      <div className="flex flex-col items-center gap-2">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden"
        >
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 bg-[#C49A2A] rounded-full"
          />
        </motion.div>
        <p className="text-sm font-medium text-gray-500 tracking-widest uppercase mt-2">{text}</p>
      </div>
    </div>
  );
}
