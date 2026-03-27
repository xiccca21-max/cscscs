import * as React from "react";

import { cn } from "@/lib/utils";

export interface CardProps {
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ title, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-bg-card p-6",
        className,
      )}
    >
      {title ? (
        <h3 className="mb-4 text-lg font-semibold text-text-heading">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}
