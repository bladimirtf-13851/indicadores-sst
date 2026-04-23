import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Company, EventRecord, MonthlyIndicator } from '../types';

export const firebaseService = {
  // Companies
  async getCompanies() {
    const q = collection(db, 'companies');
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
  },

  listenCompanies(callback: (companies: Company[]) => void) {
    return onSnapshot(collection(db, 'companies'), (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    });
  },

  async addCompany(company: Omit<Company, 'id'>) {
    return await addDoc(collection(db, 'companies'), company);
  },

  // Records
  async getRecords(companyId: string) {
    const q = query(collection(db, 'records'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRecord));
  },

  listenRecords(companyId: string, callback: (records: EventRecord[]) => void) {
    const q = query(collection(db, 'records'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRecord)));
    });
  },

  async addRecord(record: Omit<EventRecord, 'id'>) {
    return await addDoc(collection(db, 'records'), record);
  },

  async deleteRecord(id: string) {
    return await deleteDoc(doc(db, 'records', id));
  },

  // Configs
  async getConfigs(companyId: string) {
    const q = query(collection(db, 'configs'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const configs: Record<string, { employeeCount: number, programmedDays: number }> = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      configs[data.month] = { 
        employeeCount: data.employeeCount, 
        programmedDays: data.programmedDays 
      };
    });
    return configs;
  },

  listenConfigs(companyId: string, callback: (configs: { 
    monthlyEmployeeCount: Record<string, number>, 
    monthlyProgrammedDays: Record<string, number> 
  }) => void) {
    const q = query(collection(db, 'configs'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const employeeCount: Record<string, number> = {};
      const programmedDays: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        employeeCount[data.month] = data.employeeCount;
        programmedDays[data.month] = data.programmedDays;
      });
      callback({ monthlyEmployeeCount: employeeCount, monthlyProgrammedDays: programmedDays });
    });
  },

  async updateConfig(companyId: string, month: string, employeeCount: number, programmedDays: number) {
    const configId = `${companyId}_${month}`;
    return await setDoc(doc(db, 'configs', configId), {
      companyId,
      month,
      employeeCount,
      programmedDays
    });
  },

  // Users & Roles
  async createUserProfile(uid: string, email: string, role: 'admin' | 'company', companyId?: string) {
    return await setDoc(doc(db, 'users', uid), {
      email,
      role,
      companyId: companyId || null,
      createdAt: new Date().toISOString()
    });
  }
};
