"use client";
import { useEffect, useState } from "react";
import { TreePine } from "lucide-react";
export default function TreeTotal({initialTotal, initialGifts}: {initialTotal: number; initialGifts: number}) {
  const [total, setTotal] = useState(initialTotal);
  const [gifts, setGifts] = useState(initialGifts);
  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch("/api/participation", {cache: "no-store"});
        if (!response.ok) return;
        const data = await response.json() as {trees: number; restorationGifts: number};
        if (Number.isSafeInteger(data.trees)) setTotal(data.trees);
        if (Number.isSafeInteger(data.restorationGifts)) setGifts(data.restorationGifts);
      } catch {}
    };
    window.addEventListener("livingTributeRecorded", refresh);
    window.addEventListener("focus", refresh);
    return () => {window.removeEventListener("livingTributeRecorded", refresh); window.removeEventListener("focus", refresh);};
  }, []);
  return <div className="tree-total-panel" aria-live="polite"><TreePine className="tree-total-icon" aria-hidden="true" /><strong>{total.toLocaleString()}</strong><div>Trees dedicated<br />in Robert’s memory<small>Reported by contributors after donating.</small>{gifts > 0 && <small>Plus {gifts} forest-restoration gifts</small>}</div></div>;
}
