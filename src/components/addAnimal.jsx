import React, { useState } from 'react';
import { db } from '../firebase'; // 1. Import our database
import { collection, addDoc } from 'firebase/firestore'; // 2. Import functions

function AddAnimal() {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // 3. 'animals' is the name of the collection we want to use
    const docRef = await addDoc(collection(db, 'animals'), {
      name: name,
      species: species,
      status: 'stray', // We can add default data
      addedAt: new Date() // Add a timestamp
    });

    console.log('Animal added with ID: ', docRef.id);

    // 4. Clear the form after successful submission
    setName('');
    setSpecies('');

  } catch (error) {
    console.error('Error adding animal: ', error);
    alert('Failed to add animal: ' + error.message);
  }
};

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add New Animal</h3>

      <div>
        <label>Name: </label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Species: </label>
        <input 
          type="text"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          required
        />
      </div>

      <button type="submit">Add Animal</button>
    </form>
  );
}

export default AddAnimal;