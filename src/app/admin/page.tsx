import type { Metadata } from "next";
import { AdminEditor } from "./editor";

// The panel must never end up in an index — it is a tool, not a page.
export const metadata: Metadata = {
  title: "Gündem paneli",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return <AdminEditor />;
}
