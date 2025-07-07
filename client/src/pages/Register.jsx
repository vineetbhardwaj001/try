import React, { useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import './register.css';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', form);
      setMessage('Registered successfully!');
      setTimeout(() => navigate('/verify-otp'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="modern-login-container">
      <div className="modern-login-box">
        {/* Left Panel - Register Form */}
        <div className="modern-login-form">
          <h2>SIGN UP</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="gradient-button">REGISTER</button>
            {message && <p className="message">{message}</p>}
            <p className="switch-text">
              Already have an account? <a href="/login">Log In</a>
            </p>
          </form>
          <div className="social-text"></div>
          <div className="social-icons">
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-twitter"></i>
            <i className="fab fa-google"></i>
            <i className="fab fa-linkedin-in"></i>
          </div>
        </div>

        {/* Right Panel - Welcome Text */}
        <div className="modern-login-welcome">
          <div className="logo">Logo Here</div>
          <h1>Welcome TO AAROH AI !</h1>
          <p>
            Start your musical journey with us. Connect, learn and play like never before.
          </p>
          <button className="gradient-button" onClick={() => navigate('/login')}>LOG IN</button>
          <div className="social-text"></div>
          <div className="social-icons">
            <i className="fab fa-facebook-f"></i>
            <i className="fab fa-twitter"></i>
            <i className="fab fa-google"></i>
            <i className="fab fa-linkedin-in"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
