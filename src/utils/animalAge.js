export function todayDateValue(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function ageFromBirthDate(birthDate, today = todayDateValue()) {
  const birth = parseDate(birthDate);
  const current = parseDate(today);
  if (!birth || !current || birthDate > today) return null;
  let totalMonths = (current.getUTCFullYear() - birth.getUTCFullYear()) * 12 + current.getUTCMonth() - birth.getUTCMonth();
  // A month-end birthday falls on the last day of a shorter month.
  const monthEnd = new Date(current);
  monthEnd.setUTCMonth(current.getUTCMonth() + 1, 0);
  if (current.getUTCDate() < Math.min(birth.getUTCDate(), monthEnd.getUTCDate())) totalMonths--;
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

function ageLabel({ years, months }) {
  if (!years && !months) return 'Less than 1 month';
  return [years ? `${years} ${years === 1 ? 'year' : 'years'}` : '', months ? `${months} ${months === 1 ? 'month' : 'months'}` : ''].filter(Boolean).join(' ');
}

export function formatAnimalAge(animal, today = todayDateValue()) {
  if (animal.dateOfBirth) {
    const age = ageFromBirthDate(animal.dateOfBirth, today);
    return age ? `${animal.dateOfBirthEstimated ? 'About ' : ''}${ageLabel(age)}` : 'Age unknown';
  }
  // Existing passports have an age in years, without a recorded birth date.
  if (animal.age === null || animal.age === undefined || animal.age === '') return 'Age unknown';
  const value = Number(animal.age);
  if (!Number.isFinite(value) || value < 0) return 'Age unknown';
  const months = Math.round(value * 12);
  return `About ${ageLabel({ years: Math.floor(months / 12), months: months % 12 }).toLowerCase()}`;
}
