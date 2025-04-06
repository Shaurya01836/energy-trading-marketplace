import React, { useState } from 'react';
import { createOffer } from '../../api/contractAPI';

const CreateOfferForm = ({ onOfferCreated }) => {
  const [formData, setFormData] = useState({
    energyAmount: '',
    pricePerUnit: '',
    energyType: 'solar',
    validFor: '86400' // Default 24 hours in seconds
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate inputs
      if (!formData.energyAmount || !formData.pricePerUnit) {
        throw new Error('Please fill in all required fields');
      }
      
      // Convert to appropriate formats
      const energyAmount = parseInt(formData.energyAmount);
      const pricePerUnit = parseInt(formData.pricePerUnit);
      const validFor = parseInt(formData.validFor);
      
      if (isNaN(energyAmount) || energyAmount <= 0) {
        throw new Error('Energy amount must be a positive number');
      }
      
      if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
        throw new Error('Price per unit must be a positive number');
      }
      
      // Create the offer
      await createOffer(
        energyAmount,
        pricePerUnit,
        formData.energyType,
        validFor
      );
      
      // Reset form and show success message
      setFormData({
        energyAmount: '',
        pricePerUnit: '',
        energyType: 'solar',
        validFor: '86400'
      });
      
      setSuccess(true);
      
      // Notify parent component
      if (onOfferCreated) {
        onOfferCreated();
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      setError(err.message || 'Failed to create offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>Energy offer created successfully!</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Energy Amount (kWh)
          </label>
          <input
            type="number"
            name="energyAmount"
            value={formData.energyAmount}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g. 100"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Price Per Unit (tokens)
          </label>
          <input
            type="number"
            name="pricePerUnit"
            value={formData.pricePerUnit}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g. 5"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Energy Type
          </label>
          <select
            name="energyType"
            value={formData.energyType}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="solar">Solar</option>
            <option value="wind">Wind</option>
            <option value="hydro">Hydro</option>
            <option value="biomass">Biomass</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Valid For
          </label>
          <select
            name="validFor"
            value={formData.validFor}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="3600">1 hour</option>
            <option value="21600">6 hours</option>
            <option value="43200">12 hours</option>
            <option value="86400">24 hours</option>
            <option value="604800">1 week</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
          >
            {submitting ? 'Creating Offer...' : 'Create Energy Offer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOfferForm;