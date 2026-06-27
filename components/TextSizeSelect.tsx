"use client";

import { useEffect, useState } from "react";

const textSizeClasses = ["text-size-small", "text-size-medium", "text-size-large"] as const;
type TextSize = "small" | "medium" | "large";

export function TextSizeSelect() {
  const [textSize, setTextSize] = useState<TextSize>("medium");

  useEffect(() => {
    const stored = window.localStorage.getItem("nad-text-size");
    if (stored === "small" || stored === "medium" || stored === "large") {
      setTextSize(stored);
      applyTextSize(stored);
    } else {
      applyTextSize("medium");
    }
  }, []);

  function handleChange(nextSize: TextSize) {
    setTextSize(nextSize);
    window.localStorage.setItem("nad-text-size", nextSize);
    applyTextSize(nextSize);
  }

  return (
    <label className="flex items-center gap-1 text-xs text-muted">
      Text
      <select
        value={textSize}
        onChange={(event) => handleChange(event.target.value as TextSize)}
        className="rounded border border-line bg-white px-2 py-1 text-xs text-ink"
        aria-label="Text size"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </label>
  );
}

function applyTextSize(size: TextSize) {
  document.documentElement.classList.remove(...textSizeClasses);
  document.documentElement.classList.add(`text-size-${size}`);
}
