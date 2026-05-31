import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/60 p-3">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mx-auto h-4 w-3/4" />
      <Skeleton className="mx-auto h-3 w-1/3" />
      <div className="flex justify-center gap-2 pt-1">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductRowSkeleton() {
  return (
    <section className="border-t border-black/[0.04] bg-cream px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3 lg:gap-14">
        <div className="flex flex-col gap-4 lg:col-span-1">
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-5 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="lg:col-span-2">
          <ProductGridSkeleton />
        </div>
      </div>
    </section>
  );
}

export function HomeLoadingContent() {
  return (
    <>
      <section className="relative overflow-hidden bg-cream px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-full max-w-md" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="mt-2 h-11 w-36 rounded-full" />
          </div>
          <div className="order-1 lg:order-2">
            <Skeleton className="aspect-[681/1024] w-full max-w-lg rounded-3xl" />
          </div>
        </div>
      </section>
      <section className="bg-cream px-4 pb-4 pt-8 text-center sm:px-6 lg:px-8">
        <Skeleton className="mx-auto h-4 w-40" />
        <Skeleton className="mx-auto mt-3 h-10 w-64" />
      </section>
      <ProductRowSkeleton />
      <ProductRowSkeleton />
    </>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:gap-14 lg:py-14">
      <Skeleton className="h-4 w-28" />
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="aspect-square w-full rounded-3xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ShopCollectionCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white/50">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-20" />
        <ProductGridSkeleton count={4} />
        <Skeleton className="h-4 w-36" />
      </div>
    </article>
  );
}

export function ShopLoadingContent() {
  return (
    <>
      <section className="border-b border-black/[0.04] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-10 h-4 w-40" />
          <Skeleton className="mt-3 h-10 w-32" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>
      </section>
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:gap-16">
          <ShopCollectionCardSkeleton />
          <ShopCollectionCardSkeleton />
        </div>
      </section>
    </>
  );
}

export function ShopCategoryLoadingContent() {
  return (
    <>
      <section className="border-b border-black/[0.04] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mb-8 h-4 w-40" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-4 h-6 w-28" />
        </div>
      </section>
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <ProductGridSkeleton />
        </div>
      </section>
    </>
  );
}

export function CartLoadingContent() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-36" />
      {Array.from({ length: 2 }, (_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3"
        >
          <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-14" />
        </div>
      ))}
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="ml-auto h-11 w-40 rounded-full" />
    </div>
  );
}

export function AccountLoadingContent() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 lg:py-14">
      <Skeleton className="h-4 w-28" />
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6 lg:py-14">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
