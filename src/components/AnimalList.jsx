import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // 1. Import our database
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; // 2. Import functions

function AnimalList() {
  const [animals, setAnimals] = useState([]); // 3. State to hold the list of animals
  const [loading, setLoading] = useState(true);

  // 4. This useEffect runs once when the component loads
  useEffect(() => {
    // 5. Create a query to get animals, ordered by when they were added
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));

    // 6. onSnapshot is a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const animalsData = [];
      querySnapshot.forEach((doc) => {
        // 7. Get the data and add the document ID
        animalsData.push({ ...doc.data(), id: doc.id });
      });
      setAnimals(animalsData); // 8. Update our state with the new data
      setLoading(false);
    }, (error) => {
      console.error("Error fetching animals: ", error);
      setLoading(false);
    });

    // 9. Cleanup: stop listening when the component unmounts
    return () => unsubscribe();

  }, []); // The empty [] means this runs only once

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
          {/* 10. Loop over the animals in state and display them */}
          {animals.map(animal => (
            <li key={animal.id}>
              <strong>{animal.name}</strong> ({animal.species}) - Status: {animal.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AnimalList;