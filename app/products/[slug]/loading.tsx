import { ProductDetailSkeleton } from "@/components/loading/LoadingSkeletons";
import { PageLoadingShell } from "@/components/loading/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell>
      <ProductDetailSkeleton />
    </PageLoadingShell>
  );
}
