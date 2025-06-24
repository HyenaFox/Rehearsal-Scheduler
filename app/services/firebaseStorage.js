import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export class FirebaseStorageService {
  // Authentication
  static async signUp(email, password, username, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        username,
        displayName,
        email,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
  
  // User Profile Management
  static async getUserProfile(userId) {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async updateUserProfile(userId, profileData) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Project Management
  static async createProject(projectData) {
    try {
      const projectRef = doc(collection(db, 'projects'));
      await setDoc(projectRef, {
        ...projectData,
        createdAt: new Date().toISOString(),
        id: projectRef.id
      });
      return { success: true, id: projectRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async getUserProjects(userId) {
    try {
      const q = query(
        collection(db, 'projects'),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const projects = [];
      querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Timeslots
  static async getTimeslots(projectId) {
    try {
      const q = query(collection(db, 'timeslots'), where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      const timeslots = [];
      querySnapshot.forEach((doc) => {
        timeslots.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: timeslots };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async saveTimeslot(projectId, timeslotData) {
    try {
      const docRef = doc(collection(db, 'timeslots'));
      await setDoc(docRef, {
        ...timeslotData,
        projectId,
        id: docRef.id,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Scenes
  static async getScenes(projectId) {
    try {
      const q = query(collection(db, 'scenes'), where('projectId', '==', projectId));
      const querySnapshot = await getDocs(q);
      const scenes = [];
      querySnapshot.forEach((doc) => {
        scenes.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: scenes };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async saveScene(projectId, sceneData) {
    try {
      const docRef = doc(collection(db, 'scenes'));
      await setDoc(docRef, {
        ...sceneData,
        projectId,
        id: docRef.id,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // User Availability
  static async saveUserAvailability(userId, projectId, timeslotId, available) {
    try {
      const docRef = doc(db, 'availability', `${userId}_${projectId}_${timeslotId}`);
      await setDoc(docRef, {
        userId,
        projectId,
        timeslotId,
        available,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async getUserAvailability(userId, projectId) {
    try {
      const q = query(
        collection(db, 'availability'),
        where('userId', '==', userId),
        where('projectId', '==', projectId)
      );
      const querySnapshot = await getDocs(q);
      const availability = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        availability[data.timeslotId] = data.available;
      });
      return { success: true, data: availability };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Rehearsals
  static async getRehearsals(projectId) {
    try {
      const q = query(
        collection(db, 'rehearsals'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const rehearsals = [];
      querySnapshot.forEach((doc) => {
        rehearsals.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: rehearsals };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async saveRehearsal(projectId, rehearsalData) {
    try {
      const docRef = doc(collection(db, 'rehearsals'));
      await setDoc(docRef, {
        ...rehearsalData,
        projectId,
        id: docRef.id,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async deleteRehearsal(rehearsalId) {
    try {
      await deleteDoc(doc(db, 'rehearsals', rehearsalId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Real-time listeners
  static subscribeToRehearsals(projectId, callback) {
    const q = query(
      collection(db, 'rehearsals'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const rehearsals = [];
      querySnapshot.forEach((doc) => {
        rehearsals.push({ id: doc.id, ...doc.data() });
      });
      callback(rehearsals);
    });
  }
  
  static subscribeToAvailability(userId, projectId, callback) {
    const q = query(
      collection(db, 'availability'),
      where('userId', '==', userId),
      where('projectId', '==', projectId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const availability = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        availability[data.timeslotId] = data.available;
      });
      callback(availability);
    });
  }
}
