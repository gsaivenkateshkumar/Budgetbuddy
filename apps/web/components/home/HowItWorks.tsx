import { TiltCard } from "@/components/motion/TiltCard";
import Link from "next/link";

const STEPS = [
  { step: "01", icon: "⌕", title: "Start with a possibility.", body: "A new laptop? A better setup? Tell us what you need and what you want to spend.", href: "/search", action: "Explore products" },
  { step: "02", icon: "⇄", title: "See the bigger picture.", body: "Bring prices, specifications, and retailer options together. Make the trade-offs clear.", href: "/compare", action: "Compare your options" },
  { step: "03", icon: "✧", title: "Find your kind of perfect.", body: "Get a recommendation with reasoning you can understand. The final choice is always yours.", href: "/ask", action: "Meet your AI buddy" },
];

export function HowItWorks() {
  return (
    <div className="journey">
      <div className="journey-heading"><div><p className="section-kicker">FROM OVERWHELMED TO ALL SET</p><h2>Less searching. More certainty.</h2></div><p>Three simple steps.<br />One much better decision.</p></div>
      <div className="journey-grid">{STEPS.map((item) => <TiltCard key={item.step} className="journey-card"><span className="journey-number">{item.step}</span><span className="journey-icon" aria-hidden="true">{item.icon}</span><h3>{item.title}</h3><p>{item.body}</p><Link href={item.href}>{item.action} <span aria-hidden="true">↗</span></Link></TiltCard>)}</div>
    </div>
  );
}
