export function countRecentAdoptions(animals, now = new Date()) {
  const end = now.getTime();
  const start = end - 7 * 24 * 60 * 60 * 1000;
  return animals.filter(animal => {
    if (animal.status !== 'adopted' || animal.adoptedAt == null) return false;
    const date = typeof animal.adoptedAt.toDate === 'function'
      ? animal.adoptedAt.toDate() : new Date(animal.adoptedAt);
    const time = date.getTime();
    return Number.isFinite(time) && time >= start && time <= end;
  }).length;
}
