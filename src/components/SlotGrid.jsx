import React from 'react';
import { Calendar, Clock, AlertTriangle, Users } from 'lucide-react';

const TIME_ROWS = [
  { rowNumber: 1, label: '09:00 AM - 10:00 AM' },
  { rowNumber: 2, label: '10:00 AM - 11:00 AM' },
  { rowNumber: 3, label: '11:00 AM - 12:00 PM' },
  { rowNumber: 4, label: '02:00 PM - 03:00 PM' },
  { rowNumber: 5, label: '03:00 PM - 04:00 PM' },
  { rowNumber: 6, label: '04:00 PM - 05:00 PM' },
];

export default function SlotGrid({
  selectedDate,
  selectedDepartment,
  bookings,
  selectedSlot,
  onSelectSlot,
  isStaffMode = false,
}) {
  
  // Helper to check if a specific slot is booked
  const getBookingForSlot = (rowNumber, slotNumber) => {
    return bookings.find(
      (b) =>
        b.date === selectedDate &&
        b.department === selectedDepartment &&
        b.rowNumber === rowNumber &&
        b.slotNumber === slotNumber
    );
  };

  const isWalkInSlot = (slotNumber) => {
    return [2, 4, 6].includes(slotNumber);
  };

  return (
    <div className="slots-container">
      {/* Legend showing different slot statuses */}
      <div className="slot-legend">
        <div className="legend-item">
          <div className="legend-color color-available"></div>
          <span>Available Online</span>
        </div>
        <div className="legend-item">
          <div className="legend-color color-walkin"></div>
          <span>Reserved for Walk-ins (Physical)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color color-selected"></div>
          <span>Selected Slot</span>
        </div>
        <div className="legend-item">
          <div className="legend-color color-booked"></div>
          <span>Booked Slot</span>
        </div>
      </div>

      {/* Information Warning Alert about walk-ins */}
      <div className="alert-notice">
        <AlertTriangle className="alert-notice-icon" size={20} />
        <div>
          <strong>Slot Booking Rules:</strong> Slots <strong>2, 4, and 6</strong> in each row are reserved exclusively for walk-in patients visiting physically.
          {isStaffMode ? (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}> You are in Receptionist Mode; you can book both walk-in and online slots.</span>
          ) : (
            <span> These slots cannot be booked online. Please select any available green slot.</span>
          )}
        </div>
      </div>

      {/* Rows Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {TIME_ROWS.map((row) => {
          const slots = Array.from({ length: 10 }, (_, i) => i + 1);

          return (
            <div key={row.rowNumber} className="slot-row">
              <div className="slot-row-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--primary)" />
                  <strong>{row.label}</strong>
                </span>
                <span>Row {row.rowNumber} (10 Slots Available)</span>
              </div>

              <div className="slot-grid">
                {slots.map((slotNum) => {
                  const booking = getBookingForSlot(row.rowNumber, slotNum);
                  const isBooked = !!booking;
                  const isWalkIn = isWalkInSlot(slotNum);
                  const isSelected =
                    selectedSlot &&
                    selectedSlot.rowNumber === row.rowNumber &&
                    selectedSlot.slotNumber === slotNum;

                  // Determine css class and usability based on roles
                  let buttonClass = 'slot-btn';
                  let isDisabled = false;
                  let tooltip = `Row ${row.rowNumber}, Slot ${slotNum}`;

                  if (isBooked) {
                    buttonClass += ' booked';
                    isDisabled = true;
                    tooltip += ` - Booked by ${booking.patientName} (${booking.bookingType})`;
                  } else if (isSelected) {
                    buttonClass += ' selected';
                  } else if (isWalkIn) {
                    buttonClass += ' walkin';
                    if (!isStaffMode) {
                      isDisabled = true;
                      buttonClass += ' disabled';
                      tooltip += ' - Reserved for physical walk-in only';
                    } else {
                      buttonClass += ' staff-available';
                      tooltip += ' - Walk-in slot (Staff Bookable)';
                    }
                  } else {
                    buttonClass += ' available';
                    tooltip += ' - Available Online';
                  }

                  return (
                    <button
                      key={slotNum}
                      type="button"
                      className={buttonClass}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && onSelectSlot({ rowNumber: row.rowNumber, slotNumber: slotNum, label: row.label })}
                      title={tooltip}
                      aria-label={tooltip}
                      id={`slot-btn-${row.rowNumber}-${slotNum}`}
                    >
                      <span className="slot-number">{slotNum}</span>
                      <span className="slot-type">
                        {isBooked ? 'Booked' : isWalkIn ? 'Physical' : 'Online'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
