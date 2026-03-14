export type WealthGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currency: string;
  deadline: string; // ISO date
  createdAt: string;
};

const GOALS_KEY = "wealth_goals";
const MILESTONES_KEY = "wealth_milestones_celebrated";

export const MILESTONE_THRESHOLDS = [
  1_000, 5_000, 10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000,
  250_000, 500_000, 750_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
];

export function getGoals(): WealthGoal[] {
  const stored = localStorage.getItem(GOALS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveGoals(goals: WealthGoal[]): void {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function addGoal(goal: Omit<WealthGoal, "id" | "createdAt">): WealthGoal {
  const goals = getGoals();
  const newGoal: WealthGoal = {
    ...goal,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  goals.push(newGoal);
  saveGoals(goals);
  return newGoal;
}

export function removeGoal(id: string): void {
  const goals = getGoals().filter((g) => g.id !== id);
  saveGoals(goals);
}

export function getCelebratedMilestones(): number[] {
  const stored = localStorage.getItem(MILESTONES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function celebrateMilestone(amount: number): void {
  const celebrated = getCelebratedMilestones();
  if (!celebrated.includes(amount)) {
    celebrated.push(amount);
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(celebrated));
  }
}

export function getNextMilestone(currentAmount: number): number | null {
  return MILESTONE_THRESHOLDS.find((t) => t > currentAmount) ?? null;
}

export function getNewMilestones(currentAmount: number): number[] {
  const celebrated = getCelebratedMilestones();
  return MILESTONE_THRESHOLDS.filter(
    (t) => t <= currentAmount && !celebrated.includes(t)
  );
}
