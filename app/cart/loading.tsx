import { CartLoadingContent } from "@/components/loading/LoadingSkeletons";
import { PageLoadingShell } from "@/components/loading/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell mainClassName="flex flex-1 flex-col">
      <CartLoadingContent />
    </PageLoadingShell>
  );
}
