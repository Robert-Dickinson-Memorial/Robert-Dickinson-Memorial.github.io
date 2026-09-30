"use client";
import { useEffect, useState } from "react";
import { TreePine } from "lucide-react";
export default function TreeTotal({initialTotal, initialGifts, copy}: {initialTotal: number; initialGifts: number; copy: Record<string, string>}) {
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
  return <div className="tree-total-panel" aria-live="polite"><TreePine className="tree-total-icon" aria-hidden="true" /><strong>{total.toLocaleString()}</strong><div>{copy["tree.ui.totalLabel"]}<br />{copy["tree.ui.totalDedication"]}<small>{copy["tree.ui.totalNote"]}</small>{gifts > 0 && <small>{copy["tree.ui.restorationTotal"].replace("{count}", String(gifts))}</small>}</div></div>;
}
