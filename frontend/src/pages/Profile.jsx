import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { logoutUser } = useAuth();
  const navigate = useNavigate(); 

  const logout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className='w-full h-screen bg-primary flex items-center justify-center'>
      <button 
        onClick={logout}
        className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 
                   text-white font-semibold rounded-xl shadow-lg 
                   hover:scale-105 active:scale-95 transition-all duration-200"
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
