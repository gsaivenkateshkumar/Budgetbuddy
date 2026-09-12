/**
 * Original business-education content — not investment, legal, or tax
 * advice. These guides explain general frameworks and calculations; they
 * never claim a specific business idea will succeed, and they never cite
 * fabricated statistics or case studies.
 */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  body: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-validate-a-business-idea",
    title: "How to Validate a Business Idea Before You Spend Money",
    description:
      "A practical framework for testing whether an idea is worth pursuing — before you commit real capital to it.",
    body: [
      "Validation isn't about proving your idea will work — it's about reducing the specific uncertainties that would sink it, as cheaply as possible, before you spend real money.",
      "Start with the customer, not the product. Can you describe, in one sentence, who has this problem and why they'd pay to solve it? If you can't, that's the first thing to fix — everything else (pricing, marketing, operations) depends on getting this right.",
      "Talk to potential customers before you build anything. Five real conversations with people who match your target customer tell you more than any amount of guessing. Ask about their current behavior and past spending, not hypothetical future intent — people are unreliable at predicting what they'd actually pay for.",
      "Separate the idea from the assumptions underneath it. \"People want healthier food delivery\" is an idea. \"Office workers within 3km will pay a premium for a healthy lunch delivered in under 30 minutes\" is a testable assumption. List yours out and rank them by how much the business depends on each one being true.",
      "Capital feasibility is part of validation, not a separate step. An idea that needs ₹5 lakh to test isn't automatically bad, but if your available budget is ₹50,000, that mismatch needs to be resolved — either by scoping down, financing, or choosing a different starting point — before you go further.",
      "Competition is a signal, not a stop sign. Existing competitors usually mean there's real demand; the question is whether you have a genuine angle (price, service, niche, speed) or you're just building the same thing slower.",
      "Treat your first validation as a snapshot, not a verdict. Revisit it as you learn more — a low score on \"demand evidence\" today just means you haven't gathered evidence yet, not that the idea is dead.",
    ],
  },
  {
    slug: "how-to-calculate-break-even",
    title: "How to Calculate Break-Even (And What It Actually Tells You)",
    description:
      "The break-even formula explained plainly, with what it does and doesn't tell you about whether a business is viable.",
    body: [
      "Break-even is the point where your revenue exactly covers your costs — no profit, no loss. It answers one specific question: how much do I need to sell before this business stops losing money on a per-period basis?",
      "The formula has three inputs: fixed costs (rent, salaries, subscriptions — costs that don't change with sales volume), selling price per unit, and variable cost per unit (materials, packaging, per-order fees — costs that scale with each sale).",
      "Contribution per unit = selling price − variable cost per unit. This is what each sale actually contributes toward covering your fixed costs, after paying for the direct cost of making that sale.",
      "Break-even units = fixed costs ÷ contribution per unit. Break-even revenue = break-even units × selling price. If your contribution per unit is zero or negative, break-even is mathematically impossible at that price — you lose more money the more you sell.",
      "What break-even doesn't tell you: it doesn't say whether you'll actually reach that sales volume, how long it will take, or whether the market has room for it. It's a cost-structure calculation, not a demand forecast — pair it with real validation of demand, not just the arithmetic.",
      "Use it to sanity-check pricing decisions. If your break-even volume is obviously unrealistic for your market size (e.g., you'd need to sell more units per month than there are potential customers), that's a sign to revisit your price, your cost structure, or both — before you launch, not after.",
    ],
  },
  {
    slug: "how-much-working-capital-should-a-small-business-keep",
    title: "How Much Working Capital Should a Small Business Keep?",
    description: "A practical way to think about cash reserves for a small or early-stage business.",
    body: [
      "Working capital is the cash you keep on hand to cover day-to-day operating expenses — separate from the money you need to launch. It exists to absorb the gap between when you pay costs and when customers actually pay you.",
      "A common starting point is 3-6 months of fixed monthly operating costs (rent, salaries, subscriptions, minimum inventory) held in reserve, before counting on revenue to cover them. Seasonal or unpredictable-demand businesses generally need more; steady, contract-based businesses can often manage with less.",
      "The riskier your revenue timing, the larger the reserve should be. A business that gets paid immediately at the point of sale (retail, most food service) needs less buffer than one that invoices clients and waits 30-60 days to get paid.",
      "Don't confuse working capital with your total startup budget. Startup budget covers one-time setup costs (equipment, licensing, initial inventory); working capital covers the ongoing costs you'll face every month regardless of how sales are going, especially in the slow early months.",
      "Undercapitalizing operations is one of the most common reasons a fundamentally sound business fails — not because the idea was bad, but because it ran out of cash before revenue caught up to expenses. When you're setting your startup budget, treat working capital as a required line item, not a leftover.",
    ],
  },
  {
    slug: "fixed-vs-variable-costs",
    title: "Fixed vs. Variable Costs: Why the Difference Matters",
    description: "What separates fixed and variable costs, and why getting this classification right changes your pricing and break-even math.",
    body: [
      "Fixed costs stay roughly the same regardless of how much you sell in a given period: rent, salaries, software subscriptions, insurance, loan payments. You pay them whether you make one sale or a hundred.",
      "Variable costs scale directly with each unit sold: raw materials, packaging, per-transaction payment processing fees, delivery cost per order, sales commissions. Sell zero units, and these costs are close to zero.",
      "Some costs are semi-variable — they have a fixed base plus a variable component (e.g., a phone plan with a base fee plus per-minute charges, or a part-time staff member whose hours flex with demand). For planning purposes, it's usually fine to split these into their fixed and variable pieces rather than forcing them into one category.",
      "This classification directly drives your break-even calculation: only variable cost per unit is subtracted from price to get contribution margin; fixed costs are covered in aggregate by the total contribution from all units sold.",
      "It also changes how you think about scaling. A business with mostly fixed costs (e.g., software) gets more profitable per additional customer as it grows, once fixed costs are covered. A business with mostly variable costs (e.g., a reseller) has more predictable, but generally lower, margin expansion as it scales.",
      "When budgeting, list every recurring cost and mark it fixed or variable honestly — misclassifying a cost that's actually variable as fixed (or vice versa) will throw off your break-even and margin numbers.",
    ],
  },
  {
    slug: "how-to-price-a-product-or-service",
    title: "How to Price a Product or Service",
    description: "A framework for setting a starting price, and the assumptions worth checking before you commit to it.",
    body: [
      "There are three common starting points for pricing: cost-plus (cost per unit plus a target margin), competitor-based (priced relative to existing alternatives), and value-based (priced according to what the outcome is worth to the customer). Most small businesses should sanity-check with all three, not rely on just one.",
      "Cost-plus pricing is the easiest to compute and the easiest to get wrong in isolation — it guarantees you cover your costs, but says nothing about whether customers will actually pay that price, or whether you're leaving money on the table if your value to the customer is much higher than your cost.",
      "To cover your cost and hit a target margin: price = cost ÷ (1 − desired margin %). A 100 cost with a 20% target margin needs a price of ₹125, not ₹120 — a common pricing mistake is adding the margin percentage directly to cost instead of working backward from the target margin on the final price.",
      "Account for fees and taxes taken off the top of your selling price (payment processing, marketplace commissions, applicable taxes) before you calculate your real margin — a price that looks profitable before fees can be break-even or worse after them.",
      "Compare against real alternatives your customer would consider, not just direct competitors. If you're priced significantly above alternatives, you need a clear, communicable reason why (quality, speed, service, exclusivity) — if you can't articulate it, the customer won't infer it either.",
      "Price is not fixed forever. Plan an early review point (after your first 20-50 sales, or 4-6 weeks) to check whether your assumptions about cost, demand, and willingness to pay actually held up — adjusting is normal, not a sign of failure.",
      "This is a planning framework, not tax or regulatory advice — confirm applicable taxes, GST/VAT treatment, and compliance requirements for your specific business with a qualified professional.",
    ],
  },
  {
    slug: "how-to-plan-your-first-30-days-in-business",
    title: "How to Plan Your First 30 Days in Business",
    description: "A week-by-week structure for the first month after you decide to move from idea to action.",
    body: [
      "The first 30 days should be about reducing the biggest unknowns as cheaply and quickly as possible — not about building a polished, complete operation from day one.",
      "Week 1 — customer research: talk to real potential customers, sharpen who you're building for and what problem you're solving, and write down the assumptions you're most uncertain about.",
      "Week 2 — offer and pricing: decide exactly what you're selling, in what form, and at what price. Run the numbers (cost, margin, rough break-even) before committing capital to it.",
      "Week 3 — setup and sourcing: line up whatever you need to actually deliver the offer — suppliers, equipment, a way to take payment, a way to be found by your first customers. Keep this as lean as the offer allows; you can add polish after you have real customer feedback.",
      "Week 4 — soft launch: sell to a small, real group rather than a full public launch. Treat every sale in this window as a source of feedback, not just revenue — what worked, what confused people, what they asked for that you didn't offer.",
      "Record your first revenue and expense entries as soon as they happen, even if they're small. A habit of tracking from day one is far easier to build than retrofitting bookkeeping three months in once things get busy.",
      "Expect this plan to change. The goal of the first 30 days isn't to execute a fixed plan perfectly — it's to convert guesses into evidence quickly enough that month two is based on what you've actually learned.",
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
