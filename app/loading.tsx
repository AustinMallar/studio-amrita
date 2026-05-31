import { HomeLoadingContent } from "@/components/loading/LoadingSkeletons";
import { PageLoadingShell } from "@/components/loading/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell>
      <HomeLoadingContent />
    </PageLoadingShell>
  );
}
