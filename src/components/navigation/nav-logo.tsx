import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLogoProps {
  logo: {
    text: string;
    href: string;
  };
  className?: string;
}

export function NavLogo({ logo, className }: NavLogoProps) {
  return (
    <Link
      href={logo.href}
      className={cn(
        "flex items-center gap-2 font-bold text-lg",
        "text-slate-900 dark:text-white",
        "hover:opacity-80 transition-opacity",
        className,
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
        <span className="text-white text-sm font-bold">L</span>
      </div>
      <span className="hidden sm:inline">{logo.text}</span>
    </Link>
  );
}
