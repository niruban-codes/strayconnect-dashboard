import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function sendHealthPush(notification) {
  if (!notification) return;
  const user = await getDoc(doc(db, 'users', notification.userId));
  // Legacy single tokens may belong to a signed-out account. Never send to them.
  const tokens = user.data()?.expoPushTokens || [];
  if (!tokens.length) return;
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(tokens.map(to => ({ to, sound: 'default', title: notification.title, body: notification.message }))),
  });
  const result = await response.json();
  const tickets = Array.isArray(result.data) ? result.data : [result.data];
  if (!response.ok || result.errors?.length || tickets.some(ticket => !ticket || ticket.status === 'error')) {
    throw new Error('Push delivery was not accepted; the in-app notification is saved.');
  }
}
