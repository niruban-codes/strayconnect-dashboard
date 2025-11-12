import React from 'react';
import AddAnimal from './AddAnimal';
import AnimalList from './AnimalList';

const Dashboard = () => {
  return (
    <div>
      {/* Wrap the form in a card */}
      <article className="card">
        <AddAnimal />
      </article>

      {/* Wrap the list in its own card */}
      <article className="card animal-list">
        <AnimalList />
      </article>
    </div>
  );
};

export default Dashboard;