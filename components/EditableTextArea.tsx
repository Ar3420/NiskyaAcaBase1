"use client";

import type { KeyboardEvent, TextareaHTMLAttributes } from "react";

export function EditableTextArea({ onKeyDown, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.ctrlKey && event.shiftKey && (event.key === "8" || event.key === "*" || event.code === "Digit8")) {
      event.preventDefault();

      const textarea = event.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const bullet = start === 0 || value[start - 1] === "\n" ? "• " : "\n• ";
      const nextValue = `${value.slice(0, start)}${bullet}${value.slice(end)}`;
      const nextCursor = start + bullet.length;

      textarea.value = nextValue;
      textarea.setSelectionRange(nextCursor, nextCursor);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  return <textarea {...props} onKeyDown={handleKeyDown} />;
}
