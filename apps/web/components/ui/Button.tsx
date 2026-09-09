import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/lib/ui";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function Button({
  variant,
  size,
  className,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
  external,
}: CommonProps & { href: string; children: React.ReactNode; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
        className={buttonClass(variant, size, className)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
