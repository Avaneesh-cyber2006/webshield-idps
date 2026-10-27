import React, { useState } from 'react'
import { MessageSquare, Mail, User, CheckCircle } from 'lucide-react'
import api from '../services/api'
import { PageHeader } from '../components/ui/PageHeader'
import { Section } from '../components/ui/Section'
import { Button } from '../components/ui/Button'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      await api.post('/demo/contact', formData)
      setSuccess(true)
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      console.error('Contact failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Contact" subtitle="Send a message to the WebShield team" />

      {success && (
        <div className="mb-6 p-3 rounded-lg bg-status-online/10 border border-status-online/20 text-sm text-status-online flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Demo message received. This demonstration does not send email.
        </div>
      )}

      <Section>
        <div className="bg-base-800 border border-base-600 rounded-lg p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-base-700 border border-base-600 rounded-lg py-2.5 pl-9 pr-4 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-base-700 border border-base-600 rounded-lg py-2.5 pl-9 pr-4 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-300 mb-1.5">
                Message
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-base-500" />
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-base-700 border border-base-600 rounded-lg py-2.5 pl-9 pr-4 text-base-200 placeholder-base-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 min-h-[100px]"
                  placeholder="Your message…"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Message'}
            </Button>
          </form>
        </div>
      </Section>
    </div>
  )
}

export default Contact
