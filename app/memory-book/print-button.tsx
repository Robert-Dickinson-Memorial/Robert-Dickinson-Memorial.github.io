"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return <button className="print-book-button" onClick={() => window.print()}><Printer size={18} /> Print or save as PDF</button>;
}
