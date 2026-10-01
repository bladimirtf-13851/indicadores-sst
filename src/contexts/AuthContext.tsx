import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  id: string;
  email: string | null;
  role: 'admin' | 'company';
  companyId?: string;
  name?: string;
  active?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
});

const isMasterAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return e === 'bladimirtf@gmail.com' || e === 'bladimir.torres@edu-flex.com';
};

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const cleanEmail = firebaseUser.email?.toLowerCase().trim() || '';
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.active === false) {
          setProfile(null);
        } else {
          setProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            role: data.role || (isMasterAdminEmail(firebaseUser.email) ? 'admin' : 'company'),
            companyId: data.companyId,
            name: data.name || (isMasterAdminEmail(firebaseUser.email) ? 'Bladimir Torres (Admin)' : ''),
            active: data.active !== false,
          });
        }
        return;
      }

      // If document by UID doesn't exist, check if an admin registered them by email in Firestore
      if (cleanEmail) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const existingDoc = snap.docs[0];
            const data = existingDoc.data();
            const role = data.role || (isMasterAdminEmail(cleanEmail) ? 'admin' : 'company');
            const companyId = data.companyId;
            const name = data.name || firebaseUser.displayName || cleanEmail.split('@')[0];

            // Re-key / mirror profile under the real Auth UID so future lookups are instant
            await setDoc(userDocRef, {
              ...data,
              email: cleanEmail,
              role,
              companyId: companyId || null,
              name,
              active: true,
              updatedAt: new Date().toISOString()
            });

            setProfile({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              role,
              companyId,
              name,
              active: true,
            });
            return;
          }
        } catch (searchErr) {
          console.warn("Error searching existing profile by email:", searchErr);
        }
      }

      // If Master Admin, auto-bootstrap admin profile immediately
      if (isMasterAdminEmail(cleanEmail)) {
        const adminProfile = {
          email: cleanEmail,
          role: 'admin' as const,
          name: 'Bladimir Torres (Admin)',
          active: true,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, adminProfile);
        } catch (setErr) {
          console.warn("Could not persist admin bootstrap doc:", setErr);
        }
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'admin',
          name: 'Bladimir Torres (Admin)',
          active: true,
        });
        return;
      }

      // Newly registered or unassigned user: auto-create active profile so they can enter!
      const defaultName = firebaseUser.displayName || cleanEmail.split('@')[0] || 'Usuario';
      const defaultRole: 'admin' | 'company' = 'company';
      
      const newDocData = {
        email: cleanEmail,
        role: defaultRole,
        name: defaultName,
        active: true,
        createdAt: new Date().toISOString()
      };

      try {
        await setDoc(userDocRef, newDocData);
      } catch (createErr) {
        console.warn("Error creating initial user doc:", createErr);
      }

      setProfile({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        role: defaultRole,
        name: defaultName,
        active: true,
      });

    } catch (error) {
      console.error("Error fetching or initializing user profile:", error);
      if (isMasterAdminEmail(firebaseUser.email)) {
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'admin',
          name: 'Bladimir Torres (Admin)',
          active: true,
        });
      } else {
        // Fallback profile so user is not stuck on a loading screen or locked out
        setProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'company',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
          active: true,
        });
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || isMasterAdminEmail(user?.email),
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
