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
import { Company, EventRecord, MonthlyIndicator, AccidentInvestigation } from '../types';

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

  // Investigations (Resolución 1401/2007)
  async getInvestigations(companyId: string) {
    const q = query(collection(db, 'investigations'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccidentInvestigation));
  },

  listenInvestigations(companyId: string, callback: (investigations: AccidentInvestigation[]) => void) {
    const q = query(collection(db, 'investigations'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccidentInvestigation)));
    });
  },

  async addInvestigation(investigation: Omit<AccidentInvestigation, 'id'>) {
    return await addDoc(collection(db, 'investigations'), investigation);
  },

  async updateInvestigation(id: string, investigation: Partial<AccidentInvestigation>) {
    return await updateDoc(doc(db, 'investigations', id), investigation);
  },

  async deleteInvestigation(id: string) {
    return await deleteDoc(doc(db, 'investigations', id));
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

  async updateRecord(id: string, record: Partial<EventRecord>) {
    return await updateDoc(doc(db, 'records', id), record);
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
  async createUserProfile(uid: string, email: string, role: 'admin' | 'company', companyId?: string, name?: string, active: boolean = true) {
    return await setDoc(doc(db, 'users', uid), {
      email,
      role,
      companyId: companyId || null,
      name: name || '',
      active,
      createdAt: new Date().toISOString()
    });
  },

  async getCompanyUsers(companyId: string) {
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateUserProfile(uid: string, data: any) {
    return await updateDoc(doc(db, 'users', uid), data);
  },

  async deleteUserProfile(uid: string) {
    return await deleteDoc(doc(db, 'users', uid));
  }
};
