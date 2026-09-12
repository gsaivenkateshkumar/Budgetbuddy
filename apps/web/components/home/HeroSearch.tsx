export function HeroSearch() {
  return (
    <form action="/search" method="GET" className="hero-search" role="search">
      <label htmlFor="hero-search" className="sr-only">Search products</label>
      <span aria-hidden="true">⌕</span>
      <input id="hero-search" name="q" type="search" placeholder="Something in mind? Search it here…" required />
      <button type="submit" aria-label="Search products">→</button>
    </form>
  );
}
