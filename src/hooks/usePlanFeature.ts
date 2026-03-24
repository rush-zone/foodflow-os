import { useConfigStore, PLAN_FEATURES, planIncludes, AppPlan } from "@/store/useConfigStore";

/**
 * Retorna se o plano atual tem acesso à feature.
 * Ex: usePlanFeature("crm") → false no Starter, true no Pro+
 */
export function usePlanFeature(feature: string): boolean {
  const plan = useConfigStore((s) => s.plan);
  const required = PLAN_FEATURES[feature] as AppPlan | undefined;
  if (!required) return true; // feature sem restrição
  return planIncludes(plan, required);
}

/**
 * Retorna o plano atual.
 */
export function useCurrentPlan() {
  return useConfigStore((s) => s.plan);
}
