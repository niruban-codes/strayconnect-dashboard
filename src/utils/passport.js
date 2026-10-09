// Full document IDs avoid a shared, race-prone sequential counter.
export function passportId(documentId, existing) {
  return existing || `SC-${documentId}`;
}
export async function verifyPassport(tx, ref, uid, timestamp) {
  const snapshot = await tx.get(ref);
  if (!snapshot.exists()) throw new Error('Animal no longer exists.');
  const animal = snapshot.data();
  if (animal.status === 'archived') throw new Error('Archived passports cannot be verified.');
  tx.update(ref, { animalId: passportId(ref.id, animal.animalId), isVerified: true,
    verifiedAt: timestamp, verifiedBy: uid });
}
export async function archivePassport(tx, ref, uid, timestamp) {
  const snapshot = await tx.get(ref);
  if (!snapshot.exists()) throw new Error('Animal no longer exists.');
  if (snapshot.data().status === 'archived') return;
  tx.update(ref, { status: 'archived', previousStatus: snapshot.data().status || 'unknown',
    archivedAt: timestamp, archivedBy: uid });
}
