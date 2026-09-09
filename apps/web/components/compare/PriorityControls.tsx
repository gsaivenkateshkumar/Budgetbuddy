"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Weights {
  price: number;
  performance: number;
  reviews: number;
  battery: number;
}

const PRESETS: { label: string; weights: Weights }[] = [
  { label: "Balanced", weights: { price: 40, performance: 30, reviews: 20, battery: 10 } },
  { label: "Prioritize price", weights: { price: 70, performance: 15, reviews: 10, battery: 5 } },
  { label: "Prioritize performance", weights: { price: 15, performance: 60, reviews: 15, battery: 10 } },
  { label: "Prioritize battery", weights: { price: 20, performance: 20, reviews: 20, battery: 40 } },
];

export function PriorityControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [price, setPrice] = useState(Number(searchParams.get("price") ?? 40));
  const [performance, setPerformance] = useState(Number(searchParams.get("performance") ?? 30));
  const [reviews, setReviews] = useState(Number(searchParams.get("reviews") ?? 20));
  const [battery, setBattery] = useState(Number(searchParams.get("battery") ?? 10));

  function apply(weights?: Weights) {
    const w = weights ?? { price, performance, reviews, battery };
    const params = new URLSearchParams(searchParams);
    params.set("price", String(w.price));
    params.set("performance", String(w.performance));
    params.set("reviews", String(w.reviews));
    params.set("battery", String(w.battery));
    router.push(`${pathname}?${params.toString()}`);
    if (weights) {
      setPrice(weights.price);
      setPerformance(weights.performance);
      setReviews(weights.reviews);
      setBattery(weights.battery);
    }
  }

  const sliders: { label: string; value: number; setValue: (v: number) => void }[] = [
    { label: "Price", value: price, setValue: setPrice },
    { label: "Performance", value: performance, setValue: setPerformance },
    { label: "Reviews", value: reviews, setValue: setReviews },
    { label: "Battery", value: battery, setValue: setBattery },
  ];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-slate-900">Priorities</h2>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => apply(preset.weights)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {sliders.map((slider) => (
        <div key={slider.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <label htmlFor={`priority-${slider.label}`}>{slider.label}</label>
            <span>{slider.value}</span>
          </div>
          <input
            id={`priority-${slider.label}`}
            type="range"
            min={0}
            max={100}
            value={slider.value}
            onChange={(e) => slider.setValue(Number(e.target.value))}
            className="accent-indigo-600"
          />
        </div>
      ))}

      <Button type="button" variant="primary" onClick={() => apply()}>
        Recompute recommendation
      </Button>
    </Card>
  );
}
