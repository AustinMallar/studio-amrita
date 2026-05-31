import { FooterValues } from "@/components/FooterValues";
import { PromoBar } from "@/components/PromoBar";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ReactNode } from "react";

function HeaderSkeleton() {
  return (
    <header className="border-b border-black/[0.06] bg-cream/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-24 rounded-lg lg:hidden" />
        <div className="hidden items-center gap-6 lg:flex">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-12 w-44 max-w-[280px] rounded-lg sm:w-52 lg:h-14 lg:w-64" />
        <div className="flex flex-1 items-center justify-end gap-4">
          <Skeleton className="hidden h-4 w-16 lg:block" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
    </header>
  );
}

type Props = {
  children: ReactNode;
  mainClassName?: string;
};

export function PageLoadingShell({ children, mainClassName = "flex-1" }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <PromoBar />
      <HeaderSkeleton />
      <main className={mainClassName}>{children}</main>
      <FooterValues />
    </div>
  );
}
