import { Container } from "./Container";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container className="flex flex-col gap-2 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} Budget Buddy. Your AI Shopping Buddy.</p>
        <p>
          Retailer prices and offers shown are from development/demo data sources unless otherwise
          noted.
        </p>
      </Container>
    </footer>
  );
}
