import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

export type RecordItem = DocumentData & { id: string };

export const watchCollection = (
  name: string,
  onData: (items: RecordItem[]) => void,
  sort = 'updatedAt',
): Unsubscribe => {
  try {
    const ref = query(collection(db, name), orderBy(sort, 'desc'));
    return onSnapshot(
      ref,
      (snapshot) =>
        onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
      (err) => {
        console.warn(`Error watching collection ${name}:`, err);
        // Fallback without sort if index missing
        const fallbackRef = collection(db, name);
        return onSnapshot(fallbackRef, (snap) =>
          onData(snap.docs.map((item) => ({ id: item.id, ...item.data() }))),
        );
      },
    );
  } catch (err) {
    console.warn(`Exception watching collection ${name}:`, err);
    const fallbackRef = collection(db, name);
    return onSnapshot(fallbackRef, (snap) =>
      onData(snap.docs.map((item) => ({ id: item.id, ...item.data() }))),
    );
  }
};

export const watchFilteredCollection = (
  name: string,
  field: string,
  op: any,
  value: any,
  onData: (items: RecordItem[]) => void,
): Unsubscribe => {
  const ref = query(collection(db, name), where(field, op, value));
  return onSnapshot(ref, (snapshot) =>
    onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
  );
};

export const watchAuditLogs = (
  onData: (items: RecordItem[]) => void,
): Unsubscribe => watchCollection('audit_logs', onData, 'timestamp');

export const setResponderVerification = (id: string, status: string) =>
  updateDoc(doc(db, 'responders', id), {
    verificationStatus: status,
    updatedAt: new Date(),
  });

export const setUserStatus = (id: string, status: string) =>
  updateDoc(doc(db, 'users', id), { status, updatedAt: new Date() });

export const addItem = (collectionName: string, data: Record<string, any>) =>
  addDoc(collection(db, collectionName), {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

export const updateItem = (
  collectionName: string,
  id: string,
  data: Record<string, any>,
) =>
  updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: new Date(),
  });

export const deleteItem = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

export const logAuditEvent = (
  actor: string,
  role: string,
  action: string,
  target: string,
  metadata?: Record<string, any>,
) =>
  addDoc(collection(db, 'audit_logs'), {
    actor,
    role,
    action,
    target,
    metadata: metadata || {},
    timestamp: new Date(),
  });
