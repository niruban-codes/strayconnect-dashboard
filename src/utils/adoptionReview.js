// All reads precede writes. Production callers supply refs for notifications and competing applications.
export async function reviewAdoption(tx, requestRef, animalRefForId, decision, timestamp, options = {}) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error('Invalid adoption decision.');
  const requestSnapshot = await tx.get(requestRef);
  if (!requestSnapshot.exists()) throw new Error('This application no longer exists.');
  const request = requestSnapshot.data();
  if (request.status !== 'pending') throw new Error('This application has already been processed.');
  if (!request.animalId || !request.userId) throw new Error('This application is missing animal or adopter information.');
  const animalRef = animalRefForId(request.animalId);
  const animalSnapshot = await tx.get(animalRef);
  const animal = animalSnapshot.exists() ? animalSnapshot.data() : null;
  const competing = [];
  if (decision === 'approved') {
    if (!animal) throw new Error('This animal no longer exists.');
    if (!['stray', 'sheltered'].includes(animal.status)) throw new Error('This animal is no longer available for adoption.');
    if (!animal.isVerified) throw new Error('Verify this pet before approving adoption.');
    if (animal.ownerId === request.userId) throw new Error('The applicant already owns this animal.');
    if (options.requestRefForId) {
      const ids = [...new Set([...(animal.pendingAdoptionRequestIds || []), ...(options.legacyIds || [])])].filter(id => id !== requestRef.id);
      if (ids.length > 200) throw new Error('Too many legacy applications for one review. Reconcile the legacy records first.');
      for (const id of ids) {
        const ref = options.requestRefForId(id);
        const snapshot = await tx.get(ref);
        if (snapshot.exists() && snapshot.data().status === 'pending' && snapshot.data().animalId === request.animalId) competing.push({ ref, data: snapshot.data() });
      }
    }
    tx.update(animalRef, { status: 'adopted', ownerId: request.userId, adoptedBy: request.userId, adoptedAt: timestamp,
      pendingAdoptionRequestIds: [], ownerContact: '',
      ownershipHistory: [...(animal.ownershipHistory || []), { previousOwnerId: animal.ownerId || null, ownerId: request.userId, requestId: requestRef.id || '', changedAt: options.historyTime || new Date().toISOString() }] });
  } else if (animal && options.requestRefForId) {
    tx.update(animalRef, { pendingAdoptionRequestIds: (animal.pendingAdoptionRequestIds || []).filter(id => id !== requestRef.id) });
  }
  const notify = (ref, data, status) => {
    if (!options.notificationRefForId || !data.userId) return;
    tx.set(options.notificationRefForId(ref.id), { userId: data.userId, type: 'adoption_update',
      animalId: data.animalId, requestId: ref.id, title: 'Adoption application update',
      message: status === 'closed' ? `${data.animalName || 'This pet'} has been adopted. Your application is closed.`
        : `Your application for ${data.animalName || 'this pet'} was ${status}.`, isRead: false, createdAt: timestamp });
  };
  tx.update(requestRef, { status: decision, processedAt: timestamp });
  notify(requestRef, request, decision);
  for (const other of competing) {
    tx.update(other.ref, { status: 'closed', closeReason: 'Animal adopted', processedAt: timestamp });
    notify(other.ref, other.data, 'closed');
  }
}
