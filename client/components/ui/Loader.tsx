"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LoaderProps {
  message?: string;
}

export function Loader({ message = "Loading..." }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-32 h-32 sm:w-40 sm:h-40">
        <DotLottieReact
          src="https://lottie.host/7281aac6-4b71-4b78-bd0d-4c925e62f76f/BiBF8Eipld.lottie"
          loop
          autoplay
        />
      </div>
      <p className="text-slate-600 font-medium text-lg font-[family-name:var(--font-space-grotesk)] animate-pulse">
        {message}
      </p>
    </div>
  );
}
