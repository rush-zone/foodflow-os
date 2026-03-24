import CRM from "@/components/crm/CRM";
import PlanGate from "@/components/shared/PlanGate";

export default function CRMPage() {
  return (
    <PlanGate feature="crm">
      <CRM />
    </PlanGate>
  );
}
