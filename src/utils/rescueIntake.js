export async function registerRescueAnimal(tx, reportRef, animalRef, data, uid, timestamp) {
  const report = await tx.get(reportRef);
  const animal = await tx.get(animalRef);
  if (!report.exists()) throw new Error('This report no longer exists.');
  if (report.data().linkedAnimalId) return report.data().linkedAnimalId;
  if (animal.exists()) throw new Error('This intake record already exists. Reopen the report.');
  if (!['reviewing', 'resolved'].includes(report.data().status)) throw new Error('Rescue proof must be submitted or the report resolved before intake.');
  tx.set(animalRef, { ...data, sourceReportId: reportRef.id, createdBy: uid, addedAt: timestamp });
  tx.update(reportRef, { linkedAnimalId: animalRef.id, registeredAt: timestamp, registeredBy: uid });
  return animalRef.id;
}
