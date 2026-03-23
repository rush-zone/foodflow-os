import { useMemo } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import { products } from "@/data/products";
import { affinityRules, combos, ComboDefinition } from "@/data/upsell";
import { Product } from "@/types";

export function useUpsell() {
  const items = useOrderStore((s) => s.items);
  const cartIds = new Set(items.map((i) => i.product.id));

  const suggestions: Product[] = useMemo(() => {
    if (items.length === 0) return [];

    // Collect candidate IDs from affinity rules
    const scores: Record<string, number> = {};

    for (const item of items) {
      const related = affinityRules[item.product.id] ?? [];
      for (const id of related) {
        if (!cartIds.has(id)) {
          scores[id] = (scores[id] ?? 0) + 1;
        }
      }
    }

    // Sort by score, return top 4
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p && p.available);
  }, [items]);

  const activeCombo: ComboDefinition | null = useMemo(() => {
    if (items.length === 0) return null;

    // Find the best combo (highest discount) that qualifies
    const qualifying = combos.filter((combo) =>
      combo.requires.every((id) => cartIds.has(id))
    );

    if (qualifying.length === 0) return null;
    return qualifying.reduce((best, c) => (c.discount > best.discount ? c : best));
  }, [items]);

  // Combos close to qualifying (missing 1 item)
  const nearCombo: { combo: ComboDefinition; missing: Product[] } | null = useMemo(() => {
    if (activeCombo) return null;
    if (items.length === 0) return null;

    for (const combo of combos) {
      const missing = combo.requires.filter((id) => !cartIds.has(id));
      if (missing.length === 1) {
        const missingProduct = products.find((p) => p.id === missing[0]);
        if (missingProduct) {
          return { combo, missing: [missingProduct] };
        }
      }
    }
    return null;
  }, [items, activeCombo]);

  return { suggestions, activeCombo, nearCombo };
}
