import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, ShieldCheck, X, Loader2, KeyRound, Check } from 'lucide-react';

export default function PaymentGateway({ amount, patientDetails, onPaymentSuccess, onCancel }) {
  const [step, setStep] = useState('input'); // 'input' | 'processing' | 'otp' | 'success'
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardNetwork, setCardNetwork] = useState('unknown');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef([]);

  // Auto-format card number
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    
    // Detect Card Network
    if (value.startsWith('4')) {
      setCardNetwork('visa');
    } else if (value.startsWith('5') && ['1','2','3','4','5'].includes(value.charAt(1))) {
      setCardNetwork('mastercard');
    } else if (value.startsWith('6')) {
      setCardNetwork('rupay');
    } else {
      setCardNetwork('unknown');
    }

    // Format with spaces: XXXX XXXX XXXX XXXX
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardDetails(prev => ({ ...prev, number: parts.join(' ') }));
    } else {
      setCardDetails(prev => ({ ...prev, number: value }));
    }
  };

  // Auto-format Expiry date (MM/YY)
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length >= 2) {
      const month = value.slice(0, 2);
      const year = value.slice(2);
      
      // Keep month between 1 and 12
      let m = parseInt(month, 10);
      if (m > 12) m = 12;
      if (m === 0) m = 1;
      const formattedMonth = m.toString().padStart(2, '0');

      setCardDetails(prev => ({ ...prev, expiry: year ? `${formattedMonth}/${year}` : formattedMonth }));
    } else {
      setCardDetails(prev => ({ ...prev, expiry: value }));
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardDetails(prev => ({ ...prev, cvv: value }));
  };

  // Trigger payment processing
  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (cardDetails.number.replace(/\s/g, '').length !== 16) return;
    if (cardDetails.expiry.length !== 5) return;
    if (cardDetails.cvv.length !== 3) return;
    if (!cardDetails.name.trim()) return;

    setStep('processing');
    
    // Simulate connection delay to payment gateway
    setTimeout(() => {
      // Generate simulated OTP
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setStep('otp');
    }, 2000);
  };

  // OTP Digits input handler
  const handleOtpDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue.slice(-1); // Take only last character
    setOtpDigits(newDigits);
    setOtpError('');

    // Focus next input
    if (index < 5 && cleanValue) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const newDigits = [...otpDigits];
      newDigits[index - 1] = '';
      setOtpDigits(newDigits);
      otpRefs.current[index - 1].focus();
    }
  };

  const verifyOtp = () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp === generatedOtp || enteredOtp === '123456') { // Allow 123456 as bypass
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess({
          transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          cardLast4: cardDetails.number.slice(-4),
          cardNetwork: cardNetwork
        });
      }, 1800);
    } else {
      setOtpError('Invalid One-Time Password. Please try again.');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0].focus();
    }
  };

  // Focus the first OTP box when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="var(--primary)" />
            <strong style={{ fontSize: '1.1rem' }}>Secure Payment checkout</strong>
          </div>
          <button onClick={onCancel} className="btn-ghost" disabled={step === 'processing' || step === 'success'}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-body">
          {step === 'input' && (
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Virtual Card Visualization */}
              <div className={`card-wrapper ${isFlipped ? 'flipped' : ''}`}>
                <div className="credit-card">
                  {/* Card Front */}
                  <div className="card-front">
                    <div className="card-logo">
                      <span>E-HOSPITAL BANK</span>
                      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        {cardNetwork !== 'unknown' ? cardNetwork : 'Secure Card'}
                      </span>
                    </div>
                    <div className="card-chip"></div>
                    <div className="card-number-display">
                      {cardDetails.number || '•••• •••• •••• ••••'}
                    </div>
                    <div className="card-details-row">
                      <div className="card-holder-display">
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Card Holder</span>
                        <span className="card-holder-val">{cardDetails.name.toUpperCase() || 'PATIENT NAME'}</span>
                      </div>
                      <div className="card-expiry-display">
                        <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>Expires</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cardDetails.expiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="card-back">
                    <div className="card-magnetic-strip"></div>
                    <div style={{ fontSize: '0.6rem', color: '#ccc', margin: '0 1.5rem 0.25rem 1.5rem', textTransform: 'uppercase' }}>
                      Authorized Signature
                    </div>
                    <div className="card-signature-area">
                      <span className="card-cvv-display">{cardDetails.cvv || '•••'}</span>
                    </div>
                    <div style={{ padding: '1rem 1.5rem', fontSize: '0.55rem', opacity: 0.7, lineHeight: 1.2 }}>
                      This card remains the property of E-Hospital Bank. It is simulation code intended for educational demonstration purposes only.
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RAHUL SHARMA"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                  onFocus={() => setIsFlipped(false)}
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  required
                  placeholder="4532 7890 1234 5678"
                  value={cardDetails.number}
                  onChange={handleCardNumberChange}
                  onFocus={() => setIsFlipped(false)}
                  className="form-input"
                />
              </div>

              <div className="payment-form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={handleExpiryChange}
                    onFocus={() => setIsFlipped(false)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    maxLength="3"
                    value={cardDetails.cvv}
                    onChange={handleCvvChange}
                    onFocus={() => setIsFlipped(true)}
                    onBlur={() => setIsFlipped(false)}
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '1.05rem' }}
                disabled={cardDetails.number.replace(/\s/g, '').length !== 16 || cardDetails.expiry.length !== 5 || cardDetails.cvv.length !== 3}
              >
                Pay Rs. {amount}.00 securely
              </button>

              <div className="security-badge">
                <ShieldCheck size={16} color="var(--success)" />
                <span>Simulated transaction. Card details are processed locally in your browser.</span>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={48} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1.5rem' }} />
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Processing Payment</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Connecting to secure bank gateway. Please do not close this window or hit back.
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div className="otp-container">
              <KeyRound size={48} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Secure OTP Verification</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  A verification code has been simulated for phone number +91 ******{patientDetails.phone.slice(-4)}.
                </p>
              </div>

              <div className="otp-box">
                SIMULATED OTP: <span style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>{generatedOtp}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="otp-input-row">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      maxLength="1"
                      className="otp-digit"
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>
                {otpError && <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.5rem' }}>{otpError}</span>}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
                disabled={otpDigits.includes('')}
                onClick={verifyOtp}
              >
                Submit & Authorize Payment
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.85rem', textDecoration: 'underline' }}
                onClick={() => {
                  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                  setGeneratedOtp(newOtp);
                }}
              >
                Resend OTP Code
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="success-animation">
              <div className="checkmark-circle">
                <Check size={40} strokeWidth={3} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>Payment Authorized</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Rs. {amount}.00 charge completed successfully.<br />
                Securing your hospital slot reservation...
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Dynamic inline styles for rotating animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1.2s linear infinite;
        }
      `}</style>
    </div>
  );
}
