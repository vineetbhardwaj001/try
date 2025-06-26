import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import './verifyotp.css';

const VerifyOTP = () => {
  const [form, setForm] = useState({ email: '', otp: '' });
  const [message, setMessage] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [timer, setTimer] = useState(0); // countdown timer
  const navigate = useNavigate();

  // 🕒 Timer effect for resend cooldown
  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/verify-otp', form);
      setMessage('✅ OTP Verified!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || '❌ OTP verification failed');
    }
  };

  // 🔁 Handle resend OTP
  const handleResendOTP = async () => {
    if (!form.email) return alert('Please enter email first');
    try {
      await axios.post('/auth/send-otp', { email: form.email });
      setResendMsg('✅ OTP resent to your email.');
      setTimer(30); // 30 seconds cooldown
    } catch (err) {
      setResendMsg('❌ Failed to resend OTP');
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-box">
        <h2>🔐 Verify OTP</h2>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="otp"
            type="text"
            placeholder="Enter OTP"
            value={form.otp}
            onChange={handleChange}
            required
          />
          <button type="submit">Verify</button>
        </form>

        {/* 🔁 Resend OTP section */}
        <div className="resend-otp">
          <button onClick={handleResendOTP} disabled={timer > 0}>
            {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
          </button>
          {resendMsg && <p className="message resend">{resendMsg}</p>}
        </div>

        {/* 🎵 Music bounce animation */}
        <div className="otp-bars">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
