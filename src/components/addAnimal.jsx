import React, { useState } from 'react';
import { db } from '../firebase'; // 1. Import our database
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';

function AddAnimal() {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [file, setFile] = useState(null); // <-- ADD THIS

 const handleSubmit = async (e) => {
  e.preventDefault();

  // Step 1: Check if a file is selected
  if (!file) {
    alert("Please select an image to upload.");
    return;
  }

  // Step 2: Upload the image to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  // Get these from your .env.local file
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    console.log("Uploading to Cloudinary...");
    const response = await axios.post(uploadURL, formData);

    // Get the secure URL of the uploaded image
    const imageUrl = response.data.secure_url;
    console.log("Upload successful, URL:", imageUrl);

    // Step 3: Save the animal data (including the URL) to Firestore
    console.log("Saving to Firestore...");
    const docRef = await addDoc(collection(db, 'animals'), {
      name: name,
      species: species,
      status: 'stray',
      addedAt: new Date(),
      imageUrl: imageUrl // <-- WE ARE SAVING THE IMAGE URL
    });

    console.log('Animal added with ID: ', docRef.id);

    // Clear the form
    setName('');
    setSpecies('');
    setFile(null);
    // Clear the file input (this is a bit of a trick)
    e.target.reset();

  } catch (error) {
    console.error('Error in upload process: ', error);
    alert('Failed to add animal: ' + error.message);
  }
};

  return (
    <form onSubmit={handleSubmit}>

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
      <div>
        <label>Image: </label>
        <input 
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <button type="submit">Add Animal</button>
    </form>
  );
}

export default AddAnimal;