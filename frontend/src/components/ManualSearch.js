import React, { useState } from 'react';
import axios from 'axios';
import './ManualSearch.css';

const ManualSearch = ({ onResults, onError, onLoading }) => {
  const [query, setQuery] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      onError('Please enter a medicine name');
      return;
    }

    try {
      onLoading(true);
      onError(null);

      const response = await axios.post('/api/search/manual', {
        query: query.trim()
      });

      onResults(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to search medicine. Please try again.';
      onError(errorMessage);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="manual-search">
      <h2 className="section-title">Search Medicine by Name</h2>
      <p className="section-description">
        Enter the brand name or generic name of the medicine you're looking for
      </p>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder="e.g., Paracetamol, Crocin, Aspirin..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </div>
      </form>

      <div className="search-examples">
        <p className="examples-title">Try searching for:</p>
        <div className="example-chips">
          <button
            className="example-chip"
            onClick={() => setQuery('Paracetamol')}
          >
            Paracetamol
          </button>
          <button
            className="example-chip"
            onClick={() => setQuery('Crocin')}
          >
            Crocin
          </button>
          <button
            className="example-chip"
            onClick={() => setQuery('Aspirin')}
          >
            Aspirin
          </button>
          <button
            className="example-chip"
            onClick={() => setQuery('Azithromycin')}
          >
            Azithromycin
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualSearch;
