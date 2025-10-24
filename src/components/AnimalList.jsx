import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // 1. Import our database
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore'; // 2. Import functions

function AnimalList() {
  const [animals, setAnimals] = useState([]); // State to hold the list of animals
  const [loading, setLoading] = useState(true);
  
  // 1. To track which animal is being edited (we'll store its ID)
  const [editingId, setEditingId] = useState(null); 
  // 2. To hold the new status text
  const [newStatus, setNewStatus] = useState('');

  // This useEffect runs once when the component loads
  useEffect(() => {
    // Create a query to get animals, ordered by when they were added
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));

    // onSnapshot is a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const animalsData = [];
      querySnapshot.forEach((doc) => {
        // Get the data and add the document ID
        animalsData.push({ ...doc.data(), id: doc.id });
      });
      setAnimals(animalsData); // Update our state with the new data
      setLoading(false);
    }, (error) => {
      console.error("Error fetching animals: ", error);
      setLoading(false);
    });

    // Cleanup: stop listening when the component unmounts
    return () => unsubscribe();

  }, []); // The empty [] means this runs only once

  const handleDelete = async (animalId) => {
    // Ask for confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this animal?")) {
      return; // Stop if the user clicks "Cancel"
    }
    
    try {
      // 1. Create a reference to the specific animal document
      const animalDocRef = doc(db, 'animals', animalId);
      
      // 2. Delete the document
      await deleteDoc(animalDocRef);
      
      console.log('Animal deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting animal: ', error);
      alert('Failed to delete animal: ' + error.message);
    }
  };

  const handleUpdate = async (animalId) => {
    try {
      // 1. Create a reference to the specific animal document
      const animalDocRef = doc(db, 'animals', animalId);

      // 2. Update the document with the new status
      await updateDoc(animalDocRef, {
        status: newStatus
      });

      console.log('Animal status updated!');
      
      // 3. Reset the edit state
      setEditingId(null);
      setNewStatus('');
      
    } catch (error) {
      console.error('Error updating animal: ', error);
      alert('Failed to update animal: ' + error.message);
    }
  };

  if (loading) {
    return <div>Loading animals...</div>;
  }
  
  return (
    <div>
      <h3>Registered Animals</h3>
      {animals.length === 0 ? (
        <p>No animals registered yet.</p>
      ) : (
        <ul>
          {animals.map(animal => (
            <li key={animal.id}>
              
              {/* This is the new "conditional rendering" logic */}
              {editingId === animal.id ? (
                
                // --- IF we are editing THIS animal, show a form ---
                <>
                  <strong>{animal.name}</strong> ({animal.species}) - Status: 
                  <input 
                    type="text"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ marginLeft: '5px' }}
                  />
                  <button onClick={() => handleUpdate(animal.id)} style={{ marginLeft: '5px' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ marginLeft: '5px' }}>
                    Cancel
                  </button>
                </>

              ) : (

                // --- ELSE, show the normal info ---
                <>
                  <strong>{animal.name}</strong> ({animal.species}) - Status: {animal.status}
                  
                  {/* This is the new "Edit" button */}
                  <button 
                    onClick={() => {
                      setEditingId(animal.id);
                      setNewStatus(animal.status); // Pre-fill the input with the current status
                    }} 
                    style={{ marginLeft: '10px' }}
                  >
                    Edit
                  </button>

                  <button 
                    onClick={() => handleDelete(animal.id)} 
                    style={{ marginLeft: '10px' }}
                  >
                    Delete
                  </button>
                </>

              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AnimalList;