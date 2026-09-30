"use client";

import { useEffect, useState } from "react";

const labels: Record<string, string> = {
  "chippewa-arbor-day": "Chippewa · Arbor Day Foundation",
  "chippewa-living-tribute": "Minnesota forests · A Living Tribute",
  "minnesota-living-tribute": "Minnesota forests · A Living Tribute",
  "global-one-tree-planted": "Where needed most · One Tree Planted",
  "chippewa-usda": "Chippewa · USDA Forest Service",
  "brazil-black-jaguar": "Brazil · Black Jaguar Foundation",
  "amazon-tree-nation": "Amazon · Tree-Nation / Rioterra",
  "amazon-conservation": "Amazon · Amazon Conservation",
  "arizona-living-tribute": "Arizona · A Living Tribute",
  "georgia-living-tribute": "Georgia · A Living Tribute",
  "texas-living-tribute": "Texas · A Living Tribute",
  "colorado-csfs": "Colorado · Colorado State Forest Service",
  "california-living-tribute": "California · A Living Tribute",
  "massachusetts-tree-boston": "Boston · Tree Boston",
  "massachusetts-esplanade": "Massachusetts · Esplanade Association",
  "new-england-neff": "New England · NEFF",
};

export default function ContributionReturnBar() {
  const [route, setRoute] = useState("");

  useEffect(() => {
    const choose = (value: string | null) => setRoute(value && labels[value] ? value : "");
    choose(window.sessionStorage.getItem("livingTributeRoute"));
    const onSelected = (event: Event) => choose((event as CustomEvent<string>).detail);
    const onRecorded = () => setRoute("");
    window.addEventListener("livingTributeRouteSelected", onSelected);
    window.addEventListener("livingTributeRecorded", onRecorded);
    return () => {
      window.removeEventListener("livingTributeRouteSelected", onSelected);
      window.removeEventListener("livingTributeRecorded", onRecorded);
    };
  }, []);

  if (!route) return null;

  return <aside className="tree-return-bar" aria-label="Record completed living tribute">
    <div>
      <strong>Finished your payment?</strong>
      <span>You chose {labels[route]}. Return here to record the trees or restoration gift.</span>
    </div>
    <a href="#record-tribute">Record my contribution →</a>
  </aside>;
}
