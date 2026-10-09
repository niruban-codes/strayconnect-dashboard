export async function saveMedicalRecord(tx, animalRef, notificationRef, field, record, title, message, timestamp) {
  if (!['vaccinations', 'medicalHistory'].includes(field)) throw new Error('Invalid record type.');
  const snapshot = await tx.get(animalRef);
  if (!snapshot.exists()) throw new Error('Animal no longer exists.');
  const animal = snapshot.data();
  if (animal.status === 'archived') throw new Error('Archived passports are read-only.');
  const records = animal[field] || [];
  // Stable submission ID makes an uncertain network response safe to retry.
  if (records.some(item => item.id === record.id)) return null;
  tx.update(animalRef, { [field]: [...records, record] });
  if (!animal.ownerId) return null;
  const notification = { userId: animal.ownerId, animalId: animalRef.id,
    type: 'health_update', title, message, isRead: false, createdAt: timestamp };
  tx.set(notificationRef, notification);
  return notification;
}
