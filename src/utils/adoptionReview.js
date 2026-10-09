// Invoked inside a Firestore transaction: always read current data before writing.
export async function reviewAdoption(transaction, requestRef, animalRefForId, decision, timestamp) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error('Invalid adoption decision.');
  const requestSnapshot = await transaction.get(requestRef);
  if (!requestSnapshot.exists()) throw new Error('This application no longer exists.');
  const request = requestSnapshot.data();
  if (request.status !== 'pending') throw new Error('This application has already been processed.');

  if (decision === 'approved') {
    if (!request.animalId || !request.userId) throw new Error('This application is missing animal or adopter information.');
    const animalRef = animalRefForId(request.animalId);
    const animalSnapshot = await transaction.get(animalRef);
    if (!animalSnapshot.exists()) throw new Error('This animal no longer exists.');
    const animal = animalSnapshot.data();
    if (!['stray', 'sheltered'].includes(animal.status)) {
      throw new Error('This animal is no longer available for adoption.');
    }
    if (animal.ownerId === request.userId) throw new Error('The applicant already owns this animal.');
    transaction.update(animalRef, {
      status: 'adopted', ownerId: request.userId, adoptedBy: request.userId, adoptedAt: timestamp,
    });
  }
  transaction.update(requestRef, { status: decision, processedAt: timestamp });
}
