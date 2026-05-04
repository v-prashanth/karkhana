"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  email?: string;
}

export function PasswordStrengthIndicator({ password, email }: PasswordStrengthIndicatorProps) {
  const rules = useMemo(() => {
    return [
      { label: "8+ characters", met: password.length >= 8 },
      { label: "Uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Lowercase letter", met: /[a-z]/.test(password) },
      { label: "Number", met: /[0-9]/.test(password) },
      { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
      { 
        label: "Must not contain email", 
        met: password.length > 0 && email && email.includes("@") 
          ? !password.toLowerCase().includes(email.split("@")[0].toLowerCase())
          : true // Default true if no email provided or empty password
      },
    ];
  }, [password, email]);

  const entropyScore = useMemo(() => {
    if (!password) return 0;
    
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += 26;
    if (/[A-Z]/.test(password)) poolSize += 26;
    if (/[0-9]/.test(password)) poolSize += 10;
    if (/[^A-Za-z0-9]/.test(password)) poolSize += 32;

    if (poolSize === 0) return 0;

    const entropy = password.length * Math.log2(poolSize);
    
    if (entropy < 28) return 1; // Weak
    if (entropy < 35) return 2; // Fair
    if (entropy < 59) return 3; // Strong
    return 4; // Very Strong
  }, [password]);

  const strengthLabels = ["Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500"
  ];

  if (!password) return null;

  return (
    <div className="space-y-4 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-white/50">
          <span>Password strength</span>
          <span className={cn(
            entropyScore === 1 ? "text-red-500" :
            entropyScore === 2 ? "text-yellow-500" :
            entropyScore === 3 ? "text-blue-500" :
            "text-green-500"
          )}>
            {strengthLabels[entropyScore - 1] || "Weak"}
          </span>
        </div>
        <div className="flex gap-1 h-1.5 w-full">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-full flex-1 rounded-full transition-all duration-300",
                level <= entropyScore ? strengthColors[entropyScore - 1] : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rules.map((rule, idx) => {
          // Only show email rule if email is provided
          if (rule.label === "Must not contain email" && !email) return null;

          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              {rule.met ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-white/30" />
              )}
              <span className={rule.met ? "text-white/80" : "text-white/40"}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
