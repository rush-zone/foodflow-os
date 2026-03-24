import Analytics from "@/components/analytics/Analytics";
import PlanGate from "@/components/shared/PlanGate";

export default function AnalyticsPage() {
  return (
    <PlanGate feature="analytics">
      <Analytics />
    </PlanGate>
  );
}
