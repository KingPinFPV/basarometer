'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('🔐 Password change attempt for:', user?.email);

    if (!currentPassword) {
      showMessage('יש להזין את הסיסמה הנוכחית', 'error');
      setLoading(false);
      return;
    }

    if (!newPassword) {
      showMessage('יש להזין סיסמה חדשה', 'error');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('הסיסמאות החדשות לא תואמות', 'error');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('הסיסמה החדשה חייבת להכיל לפחות 6 תווים', 'error');
      setLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      showMessage('הסיסמה החדשה חייבת להיות שונה מהנוכחית', 'error');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Attempting to sign in with current password...');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        console.error('❌ Current password verification failed:', signInError);
        showMessage('הסיסמה הנוכחית שגויה', 'error');
        setLoading(false);
        return;
      }

      console.log('✅ Current password verified, updating to new password...');

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('❌ Password update failed:', updateError);
        showMessage(`שגיאה בעדכון הסיסמה: ${updateError.message}`, 'error');
      } else {
        console.log('🎉 Password updated successfully!');
        showMessage('הסיסמה שונתה בהצלחה! מתנתק ומחבר מחדש...', 'success');
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(async () => {
          await signOut();
          setTimeout(() => {
            router.push('/');
          }, 1000);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Password change exception:', error);
      showMessage('שגיאה בשינוי הסיסמה', 'error');
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            יש להתחבר
          </h1>
          <p className="text-gray-600 mb-6">
            כדי לשנות סיסמה יש להתחבר תחילה
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            חזור לעמוד הראשי
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              שינוי סיסמה
            </h1>
            <p className="text-gray-600">
              משתמש: {user.email}
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-md mb-4 ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה נוכחית
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                placeholder="הזן את הסיסמה הנוכחית (123123)"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה חדשה
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                placeholder="הזן סיסמה חדשה (Aa123123!)"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                לפחות 6 תווים
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימות סיסמה חדשה
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
                placeholder="הזן שוב את הסיסמה החדשה"
                required
                disabled={loading}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? 'משנה סיסמה...' : 'שנה סיסמה'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              הנחיות לשינוי סיסמה:
            </h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• הזן את הסיסמה הנוכחית: 123123</li>
              <li>• הזן סיסמה חדשה חזקה: Aa123123!</li>
              <li>• וודא שהסיסמאות תואמות</li>
              <li>• הסיסמה תתעדכן מיידית</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}