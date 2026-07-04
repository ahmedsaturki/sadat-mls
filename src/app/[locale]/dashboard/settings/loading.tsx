import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

export default function Loading() {
  return (
    <div aria-busy="true" role="status">
      <LuxuryLoader />
    </div>
  );
}
