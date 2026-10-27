import React, { useState, useEffect } from 'react'
import { User, Mail, Calendar } from 'lucide-react'
import api from '../services/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { Badge } from '../components/ui/Badge'

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
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-base-400">Loading profile…</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Your account information" />
        <div className="text-base-400">Unable to load profile.</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account information and membership details" />

      <Section>
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-accent-500 shrink-0" />
              <div>
                <div className="text-sm font-medium text-base-50">{profile?.name}</div>
                <Badge variant="severity" severity="low">
                  {profile?.role || 'user'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-base-400 shrink-0" />
              <div className="text-sm text-base-300 font-mono">{profile?.email}</div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-base-600">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-base-400 shrink-0" />
              <div>
                <div className="text-[0.7rem] font-medium text-base-500 uppercase tracking-tighter">
                  Member Since
                </div>
                <div className="text-sm text-base-300">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default Profile
