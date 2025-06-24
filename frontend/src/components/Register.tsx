import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Auth.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    bio: '',
    interests: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = {
        ...formData,
        age: parseInt(formData.age),
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
      };
      await register(userData);
      navigate('/matches');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <h2>Join Co-Create Dating</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        
        <input
          type="number"
          name="age"
          placeholder="Age"
          min="18"
          value={formData.age}
          onChange={handleChange}
          required
        />
        
        <textarea
          name="bio"
          placeholder="Tell us about yourself and your co-creation interests..."
          value={formData.bio}
          onChange={handleChange}
          rows={4}
        />
        
        <input
          type="text"
          name="interests"
          placeholder="Interests (comma-separated)"
          value={formData.interests}
          onChange={handleChange}
        />
        
        <button type="submit">Register</button>
        
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;