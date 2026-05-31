import { ShopCategoryLoadingContent } from "@/components/loading/LoadingSkeletons";
import { PageLoadingShell } from "@/components/loading/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell>
      <ShopCategoryLoadingContent />
    </PageLoadingShell>
  );
}
