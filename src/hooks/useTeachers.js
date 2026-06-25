import { useEffect, useState } from 'react';
import { generateInitialTeachers } from '../data';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';

export function useTeachers(options = {}) {
  const { filterByUid = null } = options;
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};

    const initializeData = async () => {
      try {
        const colRef = collection(db, 'teachers');
        let q = colRef;
        
        // If filtering by a specific teacher UID, only load their assignments
        if (filterByUid) {
          q = query(colRef, where('ownerUid', '==', filterByUid));
        }

        console.log("Setting up snapshot listener on 'teachers' collection", filterByUid ? `filtered by uid: ${filterByUid}` : '');
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log("Snapshot received! empty:", snapshot.empty, "size:", snapshot.size);
          setError(null);
          
          if (snapshot.empty) {
            setTeachers([]);
            setIsLoading(false);
          } else {
            const fetched = snapshot.docs.map(doc => {
              const data = doc.data();
              data.id = doc.id;
              if (data && data.book && !["Spotlight 1", "Spotlight 2", "Spotlight 3"].includes(data.book)) {
                const num = (data.id ? data.id.charCodeAt(data.id.length - 1) : 0) % 3 + 1;
                data.book = `Spotlight ${num}`;
              }
              return data;
            });
            fetched.sort((a, b) => a.name.localeCompare(b.name));
            setTeachers(fetched);
            setIsLoading(false);
          }
        }, (err) => {
            console.error("Firestore onSnapshot Error:", err);
            setError("Firestore Error: " + err.message);
            setIsLoading(false);
            try {
              handleFirestoreError(err, OperationType.LIST, 'teachers');
            } catch (e) {}
        });

      } catch (err) {
        console.error("Initialization error:", err);
        setError("Initialization error: " + err.message);
        setIsLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, 'teachers');
        } catch (e) {}
      }
    };

    initializeData();

    return () => unsubscribe();
  }, [filterByUid]);

  const updateTeacher = async (id, updates) => {
    try {
      const docRef = doc(db, 'teachers', id);
      await updateDoc(docRef, updates);
    } catch (err) {
      console.error("Update error:", err);
      setError("Update error: " + err.message);
      handleFirestoreError(err, OperationType.UPDATE, `teachers/${id}`);
    }
  };

  const createTeacher = async ({ name, book, unit, lesson, group, hasUploaded, fileLink, versions, ownerUid }) => {
    try {
      const colRef = collection(db, 'teachers');
      const newDocRef = doc(colRef);
      const newTeacher = {
        id: newDocRef.id,
        name,
        book,
        unit,
        lesson,
        group: group || "Group 1",
        hasUploaded: hasUploaded || false,
        fileLink: fileLink || null,
        versions: versions || [],
        updatedAt: Date.now(),
        ...(ownerUid ? { ownerUid } : {}),
      };
      console.log("Saving new teacher assignment doc:", newDocRef.path, newTeacher);
      await setDoc(newDocRef, newTeacher);
      console.log("Successfully saved teacher on live DB!");
    } catch (err) {
      console.error("Create assignment error details:", err);
      setError("Create assignment error: " + err.message);
      handleFirestoreError(err, OperationType.CREATE, `teachers`);
    }
  };

  const bulkCreateTeachers = async (teachersList) => {
    try {
      const batch = writeBatch(db);
      teachersList.forEach((teacher) => {
        const docRef = doc(collection(db, 'teachers'));
        const newTeacher = {
          id: docRef.id,
          name: teacher.name,
          book: teacher.book,
          unit: teacher.unit,
          lesson: teacher.lesson,
          group: teacher.group || "Group 1",
          hasUploaded: false,
          fileLink: null,
          versions: [],
          updatedAt: Date.now()
        };
        batch.set(docRef, newTeacher);
      });
      await batch.commit();
      console.log(`Successfully batch saved ${teachersList.length} assignments on live DB!`);
    } catch (err) {
      console.error("Batch save of assignments failed:", err);
      setError("Batch save failed: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `teachers`);
    }
  };

  const deleteTeacher = async (id) => {
    try {
      const docRef = doc(db, 'teachers', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Delete assignment error:", err);
      setError("Delete assignment error: " + err.message);
      handleFirestoreError(err, OperationType.DELETE, `teachers/${id}`);
    }
  };

  const seedMockData = async () => {
    setIsLoading(true);
    try {
      const initial = generateInitialTeachers();
      const batch = writeBatch(db);
      initial.forEach(teacher => {
        const docRef = doc(db, 'teachers', teacher.id);
        batch.set(docRef, teacher);
      });
      await batch.commit();
      setError(null);
    } catch (err) {
      console.error("Seeding error:", err);
      setError("Seeding error: " + err.message);
      handleFirestoreError(err, OperationType.WRITE, `teachers`);
    } finally {
      setIsLoading(false);
    }
  };

  return { teachers, updateTeacher, createTeacher, bulkCreateTeachers, deleteTeacher, seedMockData, isLoading, error };
}
