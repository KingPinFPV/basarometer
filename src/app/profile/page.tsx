'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase'
import { User, Settings, Save, Lock, Shield, Edit, Phone, MapPin } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth()
  const router = useRouter()
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    city: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
        return
      }
      
      if (profile) {
        setProfileData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          city: profile.city || ''
        })
      }
    }
  }, [user, profile, loading, router])
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await updateProfile(profileData)
      
      if (error) {
        setError('שגיאה בעדכון הפרופיל')
      } else {
        setSuccess('הפרופיל עודכן בהצלחה')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch {
      setError('שגיאה בעדכון הפרופיל')
    } finally {
      setSaving(false)
    }
  }
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)
    
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('הסיסמאות החדשות אינן תואמות')
        setChangingPassword(false)
        return
      }
      
      if (passwordData.newPassword.length < 6) {
        setPasswordError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים')
        setChangingPassword(false)
        return
      }
      
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) {
        setPasswordError('שגיאה בשינוי הסיסמה')
      } else {
        setPasswordSuccess('הסיסמה שונתה בהצלחה')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setTimeout(() => setPasswordSuccess(null), 3000)
      }
    } catch {
      setPasswordError('שגיאה בשינוי הסיסמה')
    } finally {
      setChangingPassword(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">פרופיל משתמש</h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">ברוך הבא, {profile?.full_name || user.email}</p>
            {profile?.is_admin && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-800 bg-amber-100 rounded-full">
                <Shield size={12} />
                מנהל
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit size={20} />
                פרטים אישיים
              </h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  disabled
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">לא ניתן לשנות את כתובת האימייל</p>
              </div>
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  שם מלא
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס שם מלא"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Phone size={16} />
                  טלפון
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="050-1234567"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <MapPin size={16} />
                  עיר מגורים
                </label>
                <input
                  type="text"
                  id="city"
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="תל אביב, ירושלים, חיפה..."
                />
              </div>
              
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {saving ? 'שומר...' : 'שמור שינויים'}
              </button>
            </form>
          </div>
          
          {/* Password Change */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock size={20} />
                שינוי סיסמה
              </h2>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {passwordSuccess}
                </div>
              )}
              
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמה חדשה
                </label>
                <input
                  type="password"
                  id="new_password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="לפחות 6 תווים"
                  minLength={6}
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                  אימות סיסמה חדשה
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="הכנס את הסיסמה החדשה שוב"
                  dir="ltr"
                />
              </div>
              
              <button
                type="submit"
                disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock size={20} />
                {changingPassword ? 'משנה סיסמה...' : 'שנה סיסמה'}
              </button>
            </form>
          </div>
        </div>
        
        {/* User Stats */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings size={20} />
              סטטיסטיקות משתמש
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {profile?.total_reports || 0}
                </div>
                <div className="text-sm text-gray-600">דיווחי מחירים</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {profile?.reputation_score || 0}
                </div>
                <div className="text-sm text-gray-600">נקודות מוניטין</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {new Date(profile?.created_at || user.created_at).toLocaleDateString('he-IL')}
                </div>
                <div className="text-sm text-gray-600">תאריך הצטרפות</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}