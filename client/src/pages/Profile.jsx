import React, { useState, useEffect } from 'react'
import { User, Mail, Calendar } from 'lucide-react'
import api from '../services/api'

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/demo/profile')
      setProfile(response.data.user)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <div className="space-y-6">
          <div className="flex items-center">
            <User className="w-6 h-6 text-accent-500 mr-4" />
            <div>
              <div className="text-sm text-gray-400">Name</div>
              <div className="text-white font-semibold">{profile?.name}</div>
            </div>
          </div>

          <div className="flex items-center">
            <Mail className="w-6 h-6 text-accent-500 mr-4" />
            <div>
              <div className="text-sm text-gray-400">Email</div>
              <div className="text-white font-semibold">{profile?.email}</div>
            </div>
          </div>

          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-accent-500 mr-4" />
            <div>
              <div className="text-sm text-gray-400">Member Since</div>
              <div className="text-white font-semibold">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
