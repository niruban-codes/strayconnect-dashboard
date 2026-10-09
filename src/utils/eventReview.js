export async function reviewEvent(tx, eventRef, notificationRef, decision, reason, timestamp, now = new Date()) {
  if (!['approved', 'rejected'].includes(decision)) throw new Error('Invalid event decision.');
  const snapshot = await tx.get(eventRef);
  if (!snapshot.exists()) throw new Error('This event no longer exists.');
  const event = snapshot.data();
  if (event.status !== 'pending') throw new Error('This event has already been reviewed.');
  if (decision === 'approved') {
    const start = event.date?.toDate ? event.date.toDate() : event.date instanceof Date ? event.date : null;
    if (!start || !Number.isFinite(start.getTime()) || start <= now) throw new Error('The event needs a valid future start time. Ask the organizer to correct and resubmit it.');
  }
  tx.update(eventRef, { status: decision, rejectReason: decision === 'rejected' ? reason.trim() : '', processedAt: timestamp });
  if (event.userId) tx.set(notificationRef, { userId: event.userId, type: 'event_update', eventId: eventRef.id,
    title: 'Event application update', message: `Your event "${event.title}" was ${decision}.` + (decision === 'rejected' ? ` ${reason.trim()}` : ''),
    isRead: false, createdAt: timestamp });
}
