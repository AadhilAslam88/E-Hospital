import React, { useState } from 'react';
import { User, MapPin, Phone, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

export default function PatientForm({ selectedSlot, onSubmit, onCancel, date, department }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Patient name is required.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Patient area/address is required.';
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number (starting with 6-9).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="booking-split">
      {/* Patient Information Form */}
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={24} color="var(--primary)" />
          Patient Registration Details
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="patient-name">
              <User size={16} /> Patient Full Name
            </label>
            <input
              id="patient-name"
              type="text"
              name="name"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="patient-address">
              <MapPin size={16} /> Area / Address
            </label>
            <input
              id="patient-address"
              type="text"
              name="address"
              placeholder="e.g. Andheri West, Mumbai"
              value={formData.address}
              onChange={handleChange}
              className={`form-input ${errors.address ? 'input-error' : ''}`}
            />
            {errors.address && <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>{errors.address}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="patient-phone">
              <Phone size={16} /> Phone Number
            </label>
            <input
              id="patient-phone"
              type="tel"
              name="phone"
              maxLength="10"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
            />
            {errors.phone && <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>{errors.phone}</span>}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
              Back to Slots
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }}>
              Proceed to Payment <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Booking Receipt Summary Card */}
      <div className="card receipt-summary" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', height: '100%' }}>
        <div>
          <div className="receipt-header">
            <Ticket size={28} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
            <h3>Appointment Details</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>E-Hospital Reservation Slip</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="receipt-row">
              <span>Department:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{department}</strong>
            </div>
            <div className="receipt-row">
              <span>Date:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{date}</strong>
            </div>
            <div className="receipt-row">
              <span>Time Slot:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedSlot.label}</strong>
            </div>
            <div className="receipt-row">
              <span>Selected Slot:</span>
              <strong style={{ color: 'var(--primary)' }}>Slot #{selectedSlot.slotNumber} (Row {selectedSlot.rowNumber})</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
            <div className="receipt-row">
              <span>Consultation Fee:</span>
              <span>Rs. 0.00</span>
            </div>
            <div className="receipt-row">
              <span>Online Booking Charge:</span>
              <span>Rs. 100.00</span>
            </div>
          </div>
        </div>

        <div>
          <div className="receipt-row total">
            <span>Total Payable:</span>
            <span>Rs. 100.00</span>
          </div>

          <div className="security-badge" style={{ marginTop: '1rem' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>Secure 256-bit Booking Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
