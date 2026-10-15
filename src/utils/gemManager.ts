// Centralized Gem & Garden XP Manager for TaskRooz / BagTime
// Ensures synchronized balance across all components (Header, Widgets, Modals)

export interface GardenData {
  xp: number;
  gems: number;
  lastWateredDate: string;
}

const DEFAULT_GARDEN_DATA: GardenData = {
  xp: 0,
  gems: 100,
  lastWateredDate: '',
};

export const getGardenData = (userKey: string = 'guest'): GardenData => {
  try {
    const raw = localStorage.getItem(`taskrooz_garden_${userKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        gems: typeof parsed.gems === 'number' ? parsed.gems : 100,
        lastWateredDate: parsed.lastWateredDate || '',
      };
    }
  } catch {}
  return DEFAULT_GARDEN_DATA;
};

export const saveGardenData = (userKey: string = 'guest', data: GardenData): void => {
  try {
    localStorage.setItem(`taskrooz_garden_${userKey}`, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent('taskrooz_garden_updated', {
        detail: { userKey, ...data },
      })
    );
  } catch {}
};

export const getUserGems = (userKey: string = 'guest'): number => {
  return getGardenData(userKey).gems;
};

export const addGems = (userKey: string = 'guest', amount: number): number => {
  const current = getGardenData(userKey);
  const nextGems = Math.max(0, current.gems + amount);
  const nextXp = amount > 0 ? current.xp + Math.round(amount / 2) : current.xp;
  const updated: GardenData = { ...current, gems: nextGems, xp: nextXp };
  saveGardenData(userKey, updated);
  return nextGems;
};

export const deductGems = (userKey: string = 'guest', amount: number): boolean => {
  const current = getGardenData(userKey);
  if (current.gems < amount) {
    return false; // Insufficient gems!
  }
  const nextGems = current.gems - amount;
  const updated: GardenData = { ...current, gems: nextGems };
  saveGardenData(userKey, updated);
  return true;
};
