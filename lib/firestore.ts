import { collection, doc, onSnapshot, orderBy, query, updateDoc, type DocumentData, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

export type RecordItem = DocumentData & { id: string };
export const watchCollection = (name: string, onData: (items: RecordItem[]) => void, sort = 'updatedAt'): Unsubscribe => {
  const ref = query(collection(db, name), orderBy(sort, 'desc'));
  return onSnapshot(ref, snapshot => onData(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))));
};
export const watchAuditLogs = (onData: (items: RecordItem[]) => void): Unsubscribe => watchCollection('audit_logs', onData, 'timestamp');
export const setResponderVerification = (id: string, status: string) => updateDoc(doc(db, 'responders', id), { verificationStatus: status, updatedAt: new Date() });
export const setUserStatus = (id: string, status: string) => updateDoc(doc(db, 'users', id), { status, updatedAt: new Date() });
