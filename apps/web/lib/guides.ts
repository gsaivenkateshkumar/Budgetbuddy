/**
 * Original, evergreen shopping-education content — not copied retailer
 * descriptions, not live rankings. These guides help a reader evaluate a
 * purchase decision in general terms; they never cite a specific current
 * price or claim a live "best of" ranking, since Budget Buddy's catalog
 * coverage is still growing (see docs/data-sources.md).
 */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  body: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "best-laptop-specs-for-students-2026",
    title: "Best Laptop Specifications for Students in 2026",
    description:
      "What actually matters — and what doesn't — when picking a laptop for coursework, research, and everyday use.",
    body: [
      "Most students don't need the most powerful laptop on the shelf — they need one that handles note-taking, browser tabs, video calls, and the occasional heavier app (statistics software, design tools, IDEs) without slowing down or dying by lunchtime.",
      "Processor: a current-generation mid-range chip (Intel Core i5/i7, AMD Ryzen 5/7, or Apple's M-series) is enough for nearly all coursework. Reserve a higher tier only if your program specifically requires it — video editing, 3D modeling, or heavy simulation work.",
      "RAM: 8GB is a workable minimum for browsing and office work, but 16GB is the more comfortable baseline in 2026, especially with many browser tabs, virtual machines, or design software open at once. See our RAM comparison guide for the fuller trade-off.",
      "Storage: prioritize an SSD over any amount of HDD storage — the speed difference affects everything from boot time to file search. 512GB is a reasonable middle ground; go higher only if you work with large local files (video, datasets).",
      "Battery life: look for a manufacturer-rated 8+ hours under real use (rated figures are usually optimistic, so treat them as a ceiling, not a promise). A day of back-to-back classes without a charger is the practical bar.",
      "Weight and build: 1.2–1.6 kg is comfortable for daily carry; anything heavier is worth it only if you rarely move it. A metal chassis tends to hold up better over a multi-year degree than an all-plastic one.",
      "Display: 1080p (Full HD) is the practical minimum for comfortable reading and video; anything sharper is a nice-to-have, not a requirement, for most coursework.",
      "What to deprioritize: dedicated graphics cards (unless you game or do GPU-accelerated work), the very latest processor generation, and premium finishes — none of these meaningfully change the day-to-day student experience, and all of them raise the price.",
    ],
  },
  {
    slug: "how-to-choose-a-laptop-under-60000-inr",
    title: "How to Choose a Laptop Under ₹60,000",
    description:
      "A practical framework for getting the most useful laptop at this price point, without chasing spec-sheet numbers that don't matter.",
    body: [
      "At this price, you're making trade-offs — no laptop under ₹60,000 will be the fastest, lightest, and longest-lasting all at once. Start by ranking your own priorities (performance, portability, battery, display) before comparing options, so you're trading off deliberately rather than by accident.",
      "Set a floor, not a ceiling: 8GB RAM and a 512GB SSD is a reasonable minimum to avoid the laptop feeling sluggish within a year. Below that, you're likely to outgrow the machine quickly rather than save meaningfully.",
      "Check the actual processor generation, not just the family name. \"Core i5\" or \"Ryzen 5\" spans several years of hardware — a current-generation chip usually outperforms an older, higher-numbered variant from a couple of years back.",
      "Read return and warranty terms before you buy, not after. At this price point, standard consumer warranty coverage (typically 1 year) and a clear return window matter more than any single spec.",
      "Compare total cost, not sticker price alone — bundled accessories, extended warranty upsells, and financing costs can shift which option is actually cheaper.",
      "Use Budget Buddy's comparison view once retailer listings are available in your category to see specs and prices side by side, and Ask Budget Buddy if you want a recommendation narrowed to your specific use case and budget.",
    ],
  },
  {
    slug: "8gb-vs-16gb-ram",
    title: "8GB vs 16GB RAM: Which Should You Choose?",
    description:
      "A plain-language breakdown of what RAM actually does, and when the upgrade from 8GB to 16GB is worth paying for.",
    body: [
      "RAM (memory) is where your device keeps everything it's actively using — open apps, browser tabs, background processes. Run out, and the system starts swapping to slower storage or closing things for you, which is what feels like \"lag.\"",
      "8GB is workable for: web browsing with a moderate number of tabs, office documents, video calls, and light photo editing. It's the minimum that still feels usable in 2026, not a comfortable long-term buffer.",
      "16GB is the better choice if you: regularly run 15+ browser tabs, use multiple heavier apps simultaneously (design tools, IDEs, virtual machines), do photo/video editing, or want the laptop to stay comfortable for 3–4 years rather than 1–2.",
      "32GB+ is for specific workloads — large-scale video editing, 3D rendering, running multiple virtual machines, or heavy data/ML work. Most people don't need it, and it adds meaningful cost for no everyday benefit.",
      "RAM upgradability matters too: some laptops solder RAM to the motherboard (no upgrade path later), while others have accessible slots. If you're budget-constrained now but might need more later, check whether the model you're considering allows an upgrade — it can be cheaper than buying more RAM upfront.",
      "Rule of thumb: if the price difference between 8GB and 16GB versions of the same laptop is modest, take the 16GB version. If it's a large jump, it's a legitimate trade-off worth weighing against your actual usage.",
    ],
  },
  {
    slug: "how-to-compare-smartphones-before-buying",
    title: "How to Compare Smartphones Before Buying",
    description:
      "The factors that actually affect day-to-day satisfaction with a phone — beyond the headline camera megapixel count.",
    body: [
      "Camera megapixels are a marketing number, not a quality measure. Sensor size, image processing software, and low-light performance matter far more than the raw megapixel count — look for real sample photos and reviews rather than the spec sheet alone.",
      "Battery capacity (mAh) is only half the story. The same battery size performs very differently depending on the chipset's efficiency and the display's power draw — check independent battery-life test results, not just the mAh figure.",
      "Software update commitment varies a lot by manufacturer and price tier. A phone that gets 4+ years of OS and security updates stays usable (and secure) far longer than one that gets one or two.",
      "Display: refresh rate (90Hz/120Hz) noticeably improves everyday scrolling smoothness; panel type (AMOLED vs. LCD) affects contrast and color, particularly outdoors and for media consumption.",
      "Storage and RAM: 128GB storage is a reasonable baseline if you don't store much media locally (cloud photo backup, streaming); 8GB RAM is comfortable for most current Android software.",
      "Build and repairability: check IP water/dust resistance ratings if that matters for your use, and consider how expensive an eventual screen or battery replacement is likely to be — it affects the phone's real multi-year cost.",
      "Before buying: compare at least two alternatives at a similar price point rather than evaluating one phone in isolation — Budget Buddy's compare view is built for exactly this, once listings are available for your category.",
    ],
  },
  {
    slug: "electronics-buying-checklist",
    title: "A Practical Electronics Buying Checklist",
    description:
      "A short, retailer-neutral checklist to run through before any electronics purchase — not brand- or product-specific.",
    body: [
      "Define the job first. Write down what you actually need the device to do (and where your current one falls short) before looking at options — it keeps you from being pulled toward specs that don't matter for your use case.",
      "Set a real budget, including accessories. Chargers, cases, extended warranties, and setup accessories can add 10–20% to the sticker price — budget for the total, not just the headline number.",
      "Compare at least two to three alternatives at a similar price. A single listing in isolation makes even a mediocre deal look reasonable; side-by-side comparison is where the real differences show up.",
      "Check the return window and warranty terms before purchase, not after — especially for electronics, where a defect often only shows up after a few weeks of real use.",
      "Verify seller/retailer legitimacy for marketplace listings — established retailer storefronts and verified sellers on a marketplace are generally lower-risk than unfamiliar third-party sellers with no track record.",
      "Read a few independent (non-retailer) reviews, not just the star rating — a 4.5-star average can hide a pattern of the same specific complaint.",
      "Confirm what's actually in the box — some listings show accessories that aren't included, or region-specific variants that differ from what's pictured.",
      "Wait 24 hours on any non-urgent purchase over your comfort threshold — it filters out most impulse buys you'd otherwise regret.",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Real metadata derived from the guide's own content — never an invented
 * number. Assumes ~200 words/minute average adult reading speed. */
export function readingTimeMinutes(guide: Guide): number {
  const wordCount = guide.body.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}
