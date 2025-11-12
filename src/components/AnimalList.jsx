import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';

function AnimalList() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); 
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const animalsData = [];
      querySnapshot.forEach((doc) => {
        animalsData.push({ ...doc.data(), id: doc.id });
      });
      setAnimals(animalsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching animals: ", error);
      setLoading(false);
    });

    return () => unsubscribe();

  }, []);

  const handleDelete = async (animalId) => {
    if (!window.confirm("Are you sure you want to delete this animal?")) {
      return;
    }
    try {
      const animalDocRef = doc(db, 'animals', animalId);
      await deleteDoc(animalDocRef);
      console.log('Animal deleted successfully!');
    } catch (error) {
      console.error('Error deleting animal: ', error);
      alert('Failed to delete animal: ' + error.message);
    }
  };

  const handleUpdate = async (animalId) => {
    try {
      const animalDocRef = doc(db, 'animals', animalId);
      await updateDoc(animalDocRef, {
        status: newStatus
      });
      console.log('Animal status updated!');
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
      {animals.length === 0 ? (
        <p>No animals registered yet.</p>
      ) : (
        <ul>
          {animals.map(animal => (
            <li key={animal.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}> {/* Added style for alignment */}
              
              {editingId === animal.id ? (
                
                // --- IF we are editing THIS animal ---
                <>
                  {animal.imageUrl && (
                    <img 
                      src={animal.imageUrl} 
                      alt={animal.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '10px' }} 
                    />
                  )}
                  <div> {/* Added a div for better layout in edit mode */}
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
                  </div>
                </>

              ) : (

                // --- ELSE, show the normal info ---
                <>
                  {animal.imageUrl && (
                    <img 
                      src={animal.imageUrl} 
                      alt={animal.name}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '10px' }} 
                    />
                  )}
                  <div> {/* Added a div for better layout in normal mode */}
                    <strong>{animal.name}</strong> ({animal.species}) - Status: {animal.status}
                    <button 
                      onClick={() => {
                        setEditingId(animal.id);
                        setNewStatus(animal.status);
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
                  </div>
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