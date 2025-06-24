import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    interests: ''
  });
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/profile');
      setProfile(response.data.user);
      setFormData({
        name: response.data.user.name,
        age: response.data.user.age.toString(),
        bio: response.data.user.bio || '',
        interests: response.data.user.interests?.join(', ') || ''
      });
      setPhotos(response.data.user.photos || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData = {
        ...formData,
        age: parseInt(formData.age),
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
      };
      await axios.put('http://localhost:5000/api/users/profile', updateData);
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleContribute = async () => {
    const contribution = prompt('Describe your contribution:');
    if (contribution) {
      try {
        await axios.post('http://localhost:5000/api/matches/contribute', {
          type: 'general',
          value: 10,
          description: contribution
        });
        fetchProfile();
        alert('Contribution added! Your co-creation score has been updated.');
      } catch (error) {
        console.error('Error adding contribution:', error);
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await axios.post('http://localhost:5000/api/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotos(response.data.photos);
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/users/profile/photo/${index}`);
        setPhotos(response.data.photos);
      } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo');
      }
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="header-buttons">
          <button onClick={() => navigate('/accessibility')} className="accessibility-btn">
            ⚙️ Accessibility
          </button>
          <button onClick={() => navigate('/matches')}>Back to Matches</button>
        </div>
      </div>

      <div className="profile-content">
        {!editing ? (
          <div className="profile-view">
            <div className="photo-gallery">
              <h3>Photos</h3>
              <div className="photos-grid">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img src={`http://localhost:5000${photo}`} alt={`Profile ${index + 1}`} />
                    <button 
                      className="delete-photo-btn"
                      onClick={() => handlePhotoDelete(index)}
                      title="Delete photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 6 && (
                  <div className="photo-upload">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="photo-upload" className="upload-label">
                      {uploading ? 'Uploading...' : '+ Add Photo'}
                    </label>
                  </div>
                )}
              </div>
              <p className="photo-info">You can upload up to 6 photos (max 5MB each)</p>
            </div>

            <h2>{profile.name}, {profile.age}</h2>
            <p className="email">{profile.email}</p>
            <p className="bio">{profile.bio}</p>
            
            <div className="interests">
              <h3>Interests</h3>
              {profile.interests?.map((interest: string, idx: number) => (
                <span key={idx} className="interest-tag">{interest}</span>
              ))}
            </div>
            
            <div className="co-creation-score">
              <h3>Co-Creation Score</h3>
              <div className="score-display">{profile.coCreationScore || 0}</div>
              <button onClick={handleContribute}>Add Contribution</button>
            </div>
            
            <button className="edit-button" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <input
              type="number"
              placeholder="Age"
              min="18"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
            />
            
            <textarea
              placeholder="Bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
            />
            
            <input
              type="text"
              placeholder="Interests (comma-separated)"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            />
            
            <div className="form-buttons">
              <button type="submit">Save</button>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;