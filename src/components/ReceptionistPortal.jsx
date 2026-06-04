import React, { useState, useEffect } from 'react';
import SlotGrid from './SlotGrid';
import { Calendar, Users, PlusCircle, Search, Trash2, ShieldAlert, Award, Database } from 'lucide-react';

export default function ReceptionistPortal({
  bookings,
  selectedDate,
  selectedDepartment,
  onDateChange,
  onDepartmentChange,
  onAddBooking,
  onCancelBooking,
  departments,
  dates,
}) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [globalBookings, setGlobalBookings] = useState([]);

  // Fetch all bookings for receptionist list
  const fetchGlobalBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setGlobalBookings(data);
      }
    } catch (err) {
      console.error('Failed to load global receptionist database bookings:', err);
    }
  };

  useEffect(() => {
    fetchGlobalBookings();
  }, []);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setFormError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookWalkIn = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!patientData.name.trim() || !patientData.address.trim() || !patientData.phone.trim()) {
      setFormError('All patient fields are required for hospital records.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(patientData.phone.trim())) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }

    const bookingPayload = {
      patientName: patientData.name,
      patientArea: patientData.address,
      patientPhone: patientData.phone,
      date: selectedDate,
      department: selectedDepartment,
      rowNumber: selectedSlot.rowNumber,
      slotNumber: selectedSlot.slotNumber,
      bookingType: 'Physical',
      pricePaid: 0
    };

    // Save using parent handler (interfacing with API)
    const success = await onAddBooking(bookingPayload);

    if (success) {
      // Refresh receptionist patient database list
      fetchGlobalBookings();
      
      // Reset Form
      setPatientData({ name: '', address: '', phone: '' });
      setSelectedSlot(null);
      setFormError('');
    }
  };

  const handleCancel = async (id) => {
    await onCancelBooking(id);
    // Refresh receptionist directory list
    fetchGlobalBookings();
  };

  // Filter bookings for the search directory
  const filteredBookings = globalBookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.patientName.toLowerCase().includes(query) ||
      b.patientPhone.includes(query) ||
      b.department.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Award size={36} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Reception Desk Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Admin panel for physical registrations & walk-in seat allocations.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
          <ShieldAlert size={16} />
          Bypassing Online Paywall
        </div>
      </div>

      <div className="booking-split">
        {/* Slot Grid Management Section */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.25rem' }}>1. Filter & Select Slot</h3>
            
            <div className="selector-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label><Calendar size={14} /> Schedule Date</label>
                <select className="form-select" value={selectedDate} onChange={(e) => { onDateChange(e.target.value); setSelectedSlot(null); }}>
                  {dates.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><Users size={14} /> Specialty Clinic</label>
                <select className="form-select" value={selectedDepartment} onChange={(e) => { onDepartmentChange(e.target.value); setSelectedSlot(null); }}>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <SlotGrid
              selectedDate={selectedDate}
              selectedDepartment={selectedDepartment}
              bookings={bookings}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
              isStaffMode={true}
            />
          </div>
        </div>

        {/* Action Panel: Book Physical / Search Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Physical Booking Form */}
          <div className="card" style={{ border: selectedSlot ? '2px solid var(--accent)' : '1px solid var(--border-color)' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} color={selectedSlot ? 'var(--accent)' : 'var(--text-muted)'} />
              Book Walk-in Patient
            </h3>

            {selectedSlot ? (
              <form onSubmit={handleBookWalkIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--accent-light)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, border: '1px solid rgba(245,158,11,0.2)' }}>
                  Selected: Slot #{selectedSlot.slotNumber} in Time: {selectedSlot.label}
                </div>

                <div className="form-group">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={patientData.name}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Patient Area / Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter locality / address"
                    value={patientData.address}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Patient Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    placeholder="e.g. 9876543210"
                    value={patientData.phone}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>

                {formError && <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>{formError}</p>}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedSlot(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5, background: 'var(--accent)' }}>
                    Confirm Booking
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p>Please select an available slot (green) or walk-in slot (orange) from the grid to register a physical walk-in patient.</p>
              </div>
            )}
          </div>

          {/* Bookings Directory */}
          <div className="card">
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={20} color="var(--primary)" />
              Active Database Directory
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search name, phone, department, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{b.patientName}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Ph: {b.patientPhone}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Dept: {b.department} | Slot #{b.slotNumber}</div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: b.bookingType === 'Physical' ? 'var(--accent-light)' : 'var(--primary-light)',
                          color: b.bookingType === 'Physical' ? 'var(--accent)' : 'var(--primary)'
                        }}>
                          {b.bookingType === 'Physical' ? 'Walk-in' : 'Online (Paid)'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{b.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="btn-ghost"
                      style={{ color: 'var(--danger)', padding: '0.5rem' }}
                      title="Cancel Appointment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  No active appointments found.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
