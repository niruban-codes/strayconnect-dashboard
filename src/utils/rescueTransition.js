// Re-read inside the transaction; never trust a screen's cached report.
export async function transitionRescue(tx, ref, action, actor, timestamp, proofUrl, expected) {
  const snapshot = await tx.get(ref);
  if (!snapshot.exists()) throw new Error('This report no longer exists.');
  const report = snapshot.data();
  if (!actor?.uid) throw new Error('Please select a responder or sign in again.');
  if (expected && (report.status !== expected.status || report.helperId !== expected.helperId || report.proofImageUrl !== expected.proofImageUrl)) {
    throw new Error('This report changed. Review its latest details before continuing.');
  }
  let patch;
  if (action === 'claim') {
    if (report.status !== 'pending' && !(report.status === 'in_progress' && !report.helperId && actor.dispatchedBy)) throw new Error('This rescue is already assigned or closed.');
    patch = { status: 'in_progress', helperId: actor.uid, helperName: actor.name || 'Community Member',
      respondedAt: timestamp, ...(actor.dispatchedBy ? { dispatchedBy: actor.dispatchedBy } : {}), proofImageUrl: null, completedAt: null };
  } else if (action === 'proof') {
    if (report.status !== 'in_progress' || report.helperId !== actor.uid) throw new Error('You are no longer assigned to this active rescue.');
    if (!proofUrl) throw new Error('A rescue photo is required.');
    patch = { status: 'reviewing', proofImageUrl: proofUrl, completedAt: timestamp };
  } else if (action === 'reject') {
    if (report.status !== 'reviewing') throw new Error('This report is no longer awaiting review.');
    patch = { status: 'pending', helperId: null, helperName: null, proofImageUrl: null, completedAt: null, respondedAt: null };
  } else if (action === 'resolve') {
    if (!['pending', 'in_progress', 'reviewing'].includes(report.status)) throw new Error('This report is already closed.');
    patch = { status: 'resolved', resolvedAt: timestamp, resolvedBy: actor.uid };
  } else throw new Error('Invalid rescue action.');
  tx.update(ref, { ...patch, updatedAt: timestamp });
}
