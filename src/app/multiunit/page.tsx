import Multiunit from "@/components/multiunit/Multiunit";
import PlanGate from "@/components/shared/PlanGate";

export default function MultiunitPage() {
  return (
    <PlanGate feature="multiunit">
      <Multiunit />
    </PlanGate>
  );
}
