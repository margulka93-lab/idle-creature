import data from "../../design/balance.v1.json" with { type: "json" };
import flowData from "../../design/flow.v2.json" with { type: "json" };
export const flow = flowData;
export type PurchaseMode = "1" | "10" | "next" | "max";
export const purchaseModes = flow.purchaseModes as PurchaseMode[];
export const defaultPurchaseMode = flow.defaultPurchaseMode as PurchaseMode;
export type ProjectRequirements = {
  activityLevels?: Record<string, number>;
  creatureLevels?: Record<string, number>;
};
export const projectRequirements = flow.projectAdditionalRequirements as Record<
  string,
  ProjectRequirements
>;
export const balance = data;
export const activities = data.activities;
export const creatures = data.creatures;
export const projects = data.projects;
export type ActivityId = string;
export type CreatureId = string;
const ids = [...activities, ...creatures, ...projects].map((x) => x.id);
if (
  new Set(ids).size !== ids.length ||
  activities.length !== 4 ||
  creatures.length !== 3 ||
  projects.length !== 3
)
  throw new Error("Contenuti del borgo non validi");
for (const a of activities) {
  if (
    a.baseCoinsPerSecond <= 0 ||
    a.upgradeBaseCost <= 0 ||
    a.upgradeCostGrowth <= 1 ||
    (a.requiresProject && !projects.some((p) => p.id === a.requiresProject))
  )
    throw new Error("Attività non valida");
}
for (const c of creatures)
  if (!activities.some((a) => a.id === c.preferredActivity))
    throw new Error("Talento non valido");
