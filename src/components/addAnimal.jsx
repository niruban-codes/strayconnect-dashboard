import React, { useState } from 'react';
import { db } from '../firebase'; // 1. Import our database
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';

function AddAnimal() {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [files, setFiles] = useState([]);

 const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Check if files are selected
    if (files.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    try {
      console.log("Uploading images to Cloudinary...");
      
      // 2. Prepare the upload config
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      // 3. Create an upload "Promise" for each file
      // (This creates a list of upload tasks to run)
      const uploadPromises = Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        
        return axios.post(uploadURL, formData);
      });

      // 4. Wait for ALL uploads to finish
      const responses = await Promise.all(uploadPromises);

      // 5. Extract the URLs from the responses
      const uploadedUrls = responses.map((response) => response.data.secure_url);
      console.log("Uploaded URLs:", uploadedUrls);

      // 6. Save to Firestore
      console.log("Saving to Firestore...");
      const docRef = await addDoc(collection(db, 'animals'), {
        name: name,
        species: species,
        status: 'stray',
        addedAt: new Date(),
        // Save the ARRAY of all photos
        imageUrls: uploadedUrls, 
        // Save just the FIRST photo as the main one (so the current app still works)
        imageUrl: uploadedUrls[0] 
      });
      
      console.log('Animal added with ID: ', docRef.id);
      
      // 7. Clear the form
      setName('');
      setSpecies('');
      setFiles([]); // Clear the file list
      e.target.reset(); // Reset the file input visually
      alert("Animal added successfully!");
      
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
  multiple  // <-- Allows selecting multiple photos
  onChange={(e) => setFiles(e.target.files)} // <-- Captures ALL selected files
/>
      </div>

      <button type="submit">Add Animal</button>
    </form>
  );
}

export default AddAnimal;