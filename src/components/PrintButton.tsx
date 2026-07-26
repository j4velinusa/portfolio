"use client";

/** The only interactive thing on the CV page, so it stays a tiny leaf client component. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="cv-print" onClick={() => window.print()}>
      {label}
    </button>
  );
}
