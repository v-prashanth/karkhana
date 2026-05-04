"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Zap, Lock, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    quote: "Karkhana replaced our entire paper system in one day.",
    author: "Bipin Bihari Sharma",
    company: "Sri Vishwakarma Engineering Works",
  },
  {
    quote: "Our vendors now send professional invoices instead of handwritten bills.",
    author: "Procurement Manager",
    company: "EPE Process Filters",
  },
];

export function AuthBrandingPanel() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#0A0A0A] p-12 relative overflow-hidden h-full border-r border-[#1E1E1E]">
      {/* Subtle Engineering Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top: Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-black shadow-lg">
          <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold uppercase tracking-tight text-white italic">Karkhana</span>
      </div>

      {/* Middle: Rotating Testimonials */}
      <div className="relative z-10 my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <p className="text-3xl font-medium leading-tight text-white/90 italic">
              "{testimonials[currentTestimonial].quote}"
            </p>
            <div>
              <p className="font-semibold text-white/70">{testimonials[currentTestimonial].author}</p>
              <p className="text-sm text-white/40">{testimonials[currentTestimonial].company}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: Feature Highlights */}
      <div className="relative z-10 flex gap-6 text-sm font-medium text-white/60">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <span>Invoice in 30 seconds</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-accent" />
          <span>Your data, fully private</span>
        </div>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-accent" />
          <span>Works on any phone</span>
        </div>
      </div>
    </div>
  );
}
