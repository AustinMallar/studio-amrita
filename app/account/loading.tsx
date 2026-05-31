import { AccountLoadingContent } from "@/components/loading/LoadingSkeletons";
import { PageLoadingShell } from "@/components/loading/PageLoadingShell";

export default function Loading() {
  return (
    <PageLoadingShell mainClassName="flex flex-1 flex-col">
      <AccountLoadingContent />
    </PageLoadingShell>
  );
}
