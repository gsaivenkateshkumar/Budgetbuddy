"use client";

import Link from "next/link";
import { useState } from "react";
import { TiltCard } from "@/components/motion/TiltCard";
import { HeroSearch } from "./HeroSearch";

const COLLECTIONS = [
  { name: "Audio", model: "headphones", title: "Find your sound.", detail: "Noise cancellation · Comfort · Battery", query: "Help me choose wireless headphones", number: "01" },
  { name: "Phones", model: "phone", title: "Your next connection.", detail: "Camera · Performance · Everyday value", query: "Help me choose a phone under ₹30,000", number: "02" },
  { name: "Laptops", model: "laptop", title: "Make room for possibility.", detail: "Power · Portability · Productivity", query: "Help me choose a laptop for work and college", number: "03" },
];

export function Hero() {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const collection = COLLECTIONS[selected];

  return (
    <section id="home-hero" className={`spatial-hero ${paused ? "motion-paused" : ""}`}>
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="hero-eyebrow"><span /> A LITTLE INTELLIGENCE. A BETTER BUY.</p>
          <h1>Big possibilities.<br />Smarter <em>choices.</em></h1>
          <p className="hero-description">Meet your unfair advantage in shopping. Discover, compare, and find what fits your life — with an AI buddy on your side.</p>
          <div className="hero-actions">
            <Link href="/ask" className="hero-primary">Find my perfect fit <span aria-hidden="true">↗</span></Link>
            <Link href="/compare" className="hero-secondary">Compare products <span aria-hidden="true">→</span></Link>
          </div>
          <HeroSearch />
          <div className="hero-assurance"><span>✧ AI-powered insights</span><span>◎ Your budget, your rules</span></div>
        </div>
        <div className="showcase">
          <div className="showcase-top"><span>THE DISCOVERY SPACE</span><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Resume decorative animation" : "Pause decorative animation"}>{paused ? "▶ Play" : "Ⅱ Pause"}</button></div>
          <TiltCard className="product-universe">
            <div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" />
            <div className="scene-glow" aria-hidden="true" />
            <span className="scene-index" aria-hidden="true">{collection.number}</span>
            <div className="device-float" key={collection.model} aria-hidden="true">
              <div className={`device device-${collection.model}`}>
                {collection.model === "headphones" ? <><div className="headband" /><div className="headband-inner" /><div className="ear ear-left"><i /></div><div className="ear ear-right"><i /><b>bb.</b></div></> : collection.model === "phone" ? <><div className="phone-screen"><span>Make it<br />yours.</span><i /></div><div className="phone-camera" /></> : <><div className="laptop-screen"><span>Dream big.<br /><em>Do more.</em></span><i /></div><div className="laptop-base" /></>}
              </div>
            </div>
            <div className="floating-note note-insight"><span className="note-icon">✧</span><div><small>LESS GUESSWORK</small><strong>More “that’s the one.”</strong></div></div>
            <div className="floating-note note-value"><span className="value-bars" aria-hidden="true"><i /><i /><i /><i /></span><div><small>BUILT AROUND YOU</small><strong>Value beyond the price.</strong></div></div>
            <div className="scene-floor" aria-hidden="true" />
          </TiltCard>
          <div className="showcase-caption" aria-live="polite"><div><span className="scene-label">EXPLORE THE POSSIBILITIES</span><h2>{collection.title}</h2><p>{collection.detail}</p></div><Link href={`/ask?q=${encodeURIComponent(collection.query)}`} className="scene-link" aria-label={`Get advice about ${collection.name.toLowerCase()}`}>↗</Link></div>
          <div className="collection-switch" role="group" aria-label="Preview a product category">{COLLECTIONS.map((item, index) => <button key={item.name} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}><span>{item.number}</span>{item.name}</button>)}</div>
          <p className="scene-hint">Move your cursor to explore the depth · Concept illustrations</p>
        </div>
      </div>
      <div className="hero-bottom"><span>GOOD DECISIONS START HERE</span><div>Discover <b>✦</b> Compare <b>✦</b> Understand <b>✦</b> Choose confidently</div><a href="#how-it-works" aria-label="See how Budget Buddy works">Scroll to explore ↓</a></div>
    </section>
  );
}
