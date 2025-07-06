import React, { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', form);
       const { token, user } = res.data;

    if (!user.isVerified) {
      // 👉 Send OTP automatically
      await axios.post(`/api/auth/send-otp`, {
        email: user.email
      }, { withCredentials: true });

      // 👉 Save email to localStorage or context if needed
      localStorage.setItem("pendingEmail", user.email);

      // 👉 Redirect to Verify OTP Page
      navigate("/verify-otp");
    } else {
      // 👉 User is verified, proceed normally
     localStorage.setItem('token', res.data.token);
      setMessage('Login successful!');
      setTimeout(() => navigate('/home'), 1500);
    }

  } catch (err) {
    setMessage(err.response?.data?.message || 'Login failed');
  }
};
    
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>🎧 Log In / Sign Up</h2>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            required
            value={form.email}
            onChange={handleChange}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit">Log In</button>
        </form>
        <a href="/forgot-password" className="forgot-link">Forgot Password?</a>

        {/* 🎵 Animated Music Bars */}
        <div className="music-bars">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
    </div>
  );
};

export default Login;
