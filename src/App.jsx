import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  BookOpen, 
  Calendar, 
  Stethoscope, 
  Sun, 
  Moon, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  CreditCard,
  CheckCircle,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import SlotGrid from './components/SlotGrid';
import PatientForm from './components/PatientForm';
import PaymentGateway from './components/PaymentGateway';
import ReceptionistPortal from './components/ReceptionistPortal';

const DEPARTMENTS = [
  'General Medicine',
  'Pediatrics (Child Care)',
  'Cardiology (Heart)',
  'Orthopedics (Bone)',
  'Dermatology (Skin)',
  'Dental Surgery'
];

export default function App() {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Page Navigation Tabs: 'book' | 'my-appointments' | 'receptionist'
  const [activeTab, setActiveTab] = useState('book');

  // Booking Flow Steps: 1 (Select Date/Dept) | 2 (Select Slot) | 3 (Patient Info) | 4 (Payment) | 5 (Ticket)
  const [bookingStep, setBookingStep] = useState(1);

  // Dynamic Dates (Next 7 days)
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);

  // Selected Slot details
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Patient Info from form
  const [patientDetails, setPatientDetails] = useState(null);

  // Bookings database states
  const [bookings, setBookings] = useState([]); // Grid bookings for current filters
  const [myBookingsIds, setMyBookingsIds] = useState([]); // Array of IDs booked on this device
  const [myBookingsList, setMyBookingsList] = useState([]); // Detailed user booking list from backend

  // Newly booked ticket to show at step 5
  const [currentTicket, setCurrentTicket] = useState(null);

  // Show Payment gateway modal
  const [showPayment, setShowPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generate dynamic date list starting today
  useEffect(() => {
    const dates = [];
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toLocaleDateString('en-US', options));
    }
    
    setAvailableDates(dates);
    setSelectedDate(dates[0]); // Default to today
  }, []);

  // Fetch active bookings for current date & department
  const fetchGridBookings = async (date, dept) => {
    if (!date || !dept) return;
    try {
      const res = await fetch(`/api/bookings?date=${encodeURIComponent(date)}&department=${encodeURIComponent(dept)}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        console.error('Failed to load active grid bookings.');
      }
    } catch (err) {
      console.error('Error connecting to backend database:', err);
    }
  };

  // Fetch detailed information for the user's booking history
  const fetchUserBookings = async (ids) => {
    if (!ids || ids.length === 0) {
      setMyBookingsList([]);
      return;
    }
    try {
      const res = await fetch(`/api/bookings/user-list?ids=${encodeURIComponent(ids.join(','))}`);
      if (res.ok) {
        const data = await res.json();
        setMyBookingsList(data);
      } else {
        console.error('Failed to fetch user list bookings.');
      }
    } catch (err) {
      console.error('Error connecting to backend user database:', err);
    }
  };

  // Load user booking IDs from localStorage on mount
  useEffect(() => {
    const savedMyIds = localStorage.getItem('user_booking_ids');
    if (savedMyIds) {
      const ids = JSON.parse(savedMyIds);
      setMyBookingsIds(ids);
      fetchUserBookings(ids);
    }
  }, []);

  // Fetch bookings when filters change
  useEffect(() => {
    fetchGridBookings(selectedDate, selectedDept);
  }, [selectedDate, selectedDept]);

  // Sync user list bookings when IDs array changes
  useEffect(() => {
    fetchUserBookings(myBookingsIds);
  }, [myBookingsIds]);

  // Apply light/dark theme class to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingStep(3); // Progress to patient registration details
    setErrorMessage('');
  };

  const handlePatientFormSubmit = (details) => {
    setPatientDetails(details);
    setShowPayment(true); // Open simulated secure card details modal
  };

  const handlePaymentSuccess = async (paymentDetailsResult) => {
    setShowPayment(false);

    // Save Booking Record to backend
    const bookingPayload = {
      patientName: patientDetails.name,
      patientArea: patientDetails.address,
      patientPhone: patientDetails.phone,
      date: selectedDate,
      department: selectedDept,
      rowNumber: selectedSlot.rowNumber,
      slotNumber: selectedSlot.slotNumber,
      bookingType: 'Online',
      pricePaid: 100,
      transactionDetails: paymentDetailsResult
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        const savedBooking = await response.json();
        
        // Save as current device appointment
        const updatedMyIds = [...myBookingsIds, savedBooking.id];
        setMyBookingsIds(updatedMyIds);
        localStorage.setItem('user_booking_ids', JSON.stringify(updatedMyIds));

        // Reload bookings grid
        fetchGridBookings(selectedDate, selectedDept);

        // Open ticket view
        setCurrentTicket(savedBooking);
        setBookingStep(5);
        setErrorMessage('');
      } else if (response.status === 409) {
        // Double booking conflict
        setErrorMessage('Double Booking Error: This slot was booked by another patient just a moment ago. We have cancelled your transaction. Please choose a different slot.');
        setBookingStep(2); // Send back to slot selection
      } else {
        const errData = await response.json();
        setErrorMessage(errData.error || 'Server error occurred. Please try again.');
        setBookingStep(2);
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setErrorMessage('Network connection lost. Failed to submit appointment to database.');
      setBookingStep(2);
    }
  };

  const handleAddPhysicalBooking = async (bookingPayload) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        // Reload bookings grid
        fetchGridBookings(selectedDate, selectedDept);
        return true;
      } else {
        const errData = await response.json();
        alert(errData.error || 'Failed to save physical booking.');
        return false;
      }
    } catch (err) {
      console.error('Error writing physical booking:', err);
      alert('Failed to connect to backend database.');
      return false;
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this appointment reservation?')) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Remove from user specific device bookings too
          const updatedMyIds = myBookingsIds.filter(id => id !== bookingId);
          setMyBookingsIds(updatedMyIds);
          localStorage.setItem('user_booking_ids', JSON.stringify(updatedMyIds));

          // Reload bookings
          fetchGridBookings(selectedDate, selectedDept);
        } else {
          alert('Failed to cancel appointment. It may have already been cancelled.');
        }
      } catch (err) {
        console.error('Error deleting booking:', err);
        alert('Network connection failure. Unable to delete appointment.');
      }
    }
  };

  // Reset booking Wizard
  const resetBookingFlow = () => {
    setSelectedSlot(null);
    setPatientDetails(null);
    setCurrentTicket(null);
    setBookingStep(1);
    setErrorMessage('');
  };

  // Handle printer action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="header">
        <div className="header-content">
          <a href="#" className="logo-section" onClick={(e) => { e.preventDefault(); resetBookingFlow(); setActiveTab('book'); }}>
            <Stethoscope className="logo-icon" size={32} strokeWidth={2.5} />
            <span className="logo-text">E-Hospital</span>
          </a>

          <div className="nav-controls">
            {/* View selectors */}
            <nav className="nav-links">
              <button 
                className={`nav-tab ${activeTab === 'book' ? 'active' : ''}`}
                onClick={() => { setActiveTab('book'); resetBookingFlow(); }}
              >
                <Calendar size={15} /> Book Appointment
              </button>
              <button 
                className={`nav-tab ${activeTab === 'my-appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-appointments')}
              >
                <FileText size={15} /> My Bookings ({myBookingsList.length})
              </button>
              <button 
                className={`nav-tab ${activeTab === 'receptionist' ? 'active' : ''}`}
                onClick={() => setActiveTab('receptionist')}
              >
                <User size={15} /> Receptionist Desk
              </button>
            </nav>

            {/* Dark/Light Mode toggle */}
            <button className="theme-switch" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">

        {/* Global error alert */}
        {errorMessage && (
          <div className="alert-notice" style={{ backgroundColor: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            <AlertCircle size={20} />
            <div>{errorMessage}</div>
          </div>
        )}
        
        {/* Booking Form Flow (Patient Mode) */}
        {activeTab === 'book' && (
          <div>
            <div className="page-header">
              <h1>Schedule an Appointment</h1>
              <p>Book online slots instantly. Walk-in rows reserved for physical booking.</p>
            </div>

            {/* Multi-step progress bar */}
            {bookingStep <= 4 && (
              <div className="progress-bar">
                <div className="progress-line" style={{ width: `${((bookingStep - 1) / 3) * 100}%` }}></div>
                
                <div className={`progress-step ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                  1
                  <span className="step-label">Schedule Details</span>
                </div>
                <div className={`progress-step ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                  2
                  <span className="step-label">Select Slot</span>
                </div>
                <div className={`progress-step ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}>
                  3
                  <span className="step-label">Patient Details</span>
                </div>
                <div className={`progress-step ${bookingStep >= 4 ? 'active' : ''} ${bookingStep > 4 ? 'completed' : ''}`}>
                  4
                  <span className="step-label">Receipt & Pay</span>
                </div>
              </div>
            )}

            {/* Step 1 & 2: Schedule & Slots */}
            {bookingStep === 1 && (
              <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={20} color="var(--primary)" />
                  Select Date & Department
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label htmlFor="dept-select">
                      <Stethoscope size={16} /> Choose Specialty Department
                    </label>
                    <select 
                      id="dept-select" 
                      className="form-select" 
                      value={selectedDept} 
                      onChange={(e) => setSelectedDept(e.target.value)}
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="date-select">
                      <Calendar size={16} /> Choose Appointment Date
                    </label>
                    <select 
                      id="date-select" 
                      className="form-select" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                    >
                      {availableDates.map((date) => (
                        <option key={date} value={date}>{date}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ marginTop: '0.5rem', width: '100%' }}
                    onClick={() => setBookingStep(2)}
                  >
                    View Available Slots <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Select a Session Slot</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Showing slots for {selectedDept} on {selectedDate}</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => setBookingStep(1)}>
                    Change Date/Dept
                  </button>
                </div>

                <SlotGrid
                  selectedDate={selectedDate}
                  selectedDepartment={selectedDept}
                  bookings={bookings}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  isStaffMode={false}
                />
              </div>
            )}

            {/* Step 3: Registration Form */}
            {bookingStep === 3 && (
              <PatientForm
                selectedSlot={selectedSlot}
                date={selectedDate}
                department={selectedDept}
                onCancel={() => setBookingStep(2)}
                onSubmit={handlePatientFormSubmit}
              />
            )}

            {/* Step 4: Simulated Payment Trigger */}
            {showPayment && (
              <PaymentGateway
                amount={100}
                patientDetails={patientDetails}
                onCancel={() => setShowPayment(false)}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}

            {/* Step 5: Appointment Ticket Success Screen */}
            {bookingStep === 5 && currentTicket && (
              <div style={{ maxWidth: '550px', margin: '0 auto' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={56} color="var(--success)" style={{ display: 'block', margin: '0 auto 0.75rem auto' }} />
                    <h2 style={{ fontWeight: 800, fontSize: '1.75rem' }}>Reservation Confirmed</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your online appointment is secured.</p>
                  </div>

                  {/* Visual Doctor Ticket slip */}
                  <div className="ticket">
                    <div className="ticket-header-bg">
                      <strong style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.9 }}>OPD Appointment Card</strong>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>E-Hospital Ticket</h3>
                    </div>
                    <div className="ticket-content">
                      <div className="ticket-field">
                        <span className="ticket-field-label">Patient Name</span>
                        <span className="ticket-field-val">{currentTicket.patientName}</span>
                      </div>
                      <div className="ticket-field">
                        <span className="ticket-field-label">Appointment ID</span>
                        <span className="ticket-field-val" style={{ fontFamily: 'monospace' }}>{currentTicket.id}</span>
                      </div>
                      <div className="ticket-field">
                        <span className="ticket-field-label">Clinic / specialty</span>
                        <span className="ticket-field-val">{currentTicket.department}</span>
                      </div>
                      <div className="ticket-field">
                        <span className="ticket-field-label">Date & Day</span>
                        <span className="ticket-field-val">{currentTicket.date}</span>
                      </div>
                      <div className="ticket-field">
                        <span className="ticket-field-label">Time Interval</span>
                        <span className="ticket-field-val">{selectedSlot ? selectedSlot.label : 'N/A'}</span>
                      </div>
                      <div className="ticket-field">
                        <span className="ticket-field-label">Allocated Seat</span>
                        <span className="ticket-field-val" style={{ color: 'var(--primary)' }}>Slot #{currentTicket.slotNumber} (Row {currentTicket.rowNumber})</span>
                      </div>

                      <div className="ticket-field" style={{ gridColumn: 'span 2' }}>
                        <span className="ticket-field-label">Patient address</span>
                        <span className="ticket-field-val" style={{ fontWeight: 500, fontSize: '0.9rem' }}>{currentTicket.patientArea}</span>
                      </div>

                      <div className="ticket-qr">
                        <div className="qr-box">
                          <div className="qr-image-sim" />
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Scan QR code at OPD Reception desk</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handlePrint}>
                      <Printer size={16} /> Print Card
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={resetBookingFlow}>
                      Book Another Appointment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Tab: My Bookings list */}
        {activeTab === 'my-appointments' && (
          <div>
            <div className="page-header">
              <h1>My Registered Appointments</h1>
              <p>View, print, or cancel active appointments registered from this device.</p>
            </div>

            {myBookingsList.length > 0 ? (
              <div className="appointments-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {myBookingsList.map((app) => (
                  <div key={app.id} className="appointment-card">
                    <div className="appointment-card-info">
                      <span className={`appointment-badge online`}>
                        <ShieldCheck size={12} /> Online Paid
                      </span>
                      <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '0.25rem' }}>{app.patientName}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} /> {app.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} /> Slot {app.slotNumber} (Row {app.rowNumber})
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} /> {app.patientArea}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Department: <strong>{app.department}</strong> | Receipt Paid: Rs. {app.pricePaid} | ID: {app.id}
                      </div>
                    </div>

                    <div className="appointment-card-actions">
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} 
                        onClick={() => {
                          // Mock print dialog/trigger by setting a current ticket and showing ticket view
                          const mockSlotObj = {
                            rowNumber: app.rowNumber,
                            slotNumber: app.slotNumber,
                            label: 'Session Appointment'
                          };
                          setSelectedSlot(mockSlotObj);
                          setCurrentTicket(app);
                          setBookingStep(5);
                          setActiveTab('book');
                        }}
                      >
                        View Ticket
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ color: 'var(--danger)', padding: '0.5rem' }}
                        onClick={() => handleCancelBooking(app.id)}
                        title="Cancel Appointment"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <FileText className="empty-state-icon" />
                <h3>No Appointments Found</h3>
                <p>You haven't booked any online appointments yet. Click below to search for slots and register.</p>
                <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setActiveTab('book')}>
                  Book Appointment Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Receptionist Portal Tab */}
        {activeTab === 'receptionist' && (
          <ReceptionistPortal
            bookings={bookings}
            selectedDate={selectedDate}
            selectedDepartment={selectedDept}
            onDateChange={setSelectedDate}
            onDepartmentChange={setSelectedDept}
            onAddBooking={handleAddPhysicalBooking}
            onCancelBooking={handleCancelBooking}
            departments={DEPARTMENTS}
            dates={availableDates}
          />
        )}

      </main>

      {/* Footer Section */}
      <footer className="footer">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyBetween: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span>© 2026 E-Hospital Clinic. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={14} color="var(--primary)" /> Secure Healthcare Scheduling System
          </span>
        </div>
      </footer>
    </div>
  );
}
