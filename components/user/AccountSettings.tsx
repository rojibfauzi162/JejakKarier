
import React, { useState } from 'react';
import { updateProfile, updatePassword } from '@firebase/auth';
import { auth } from '../../services/firebase';
import { ReminderConfig } from '../../types';

interface AccountSettingsProps {
  reminderConfig: ReminderConfig;
  onUpdateReminders: (config: ReminderConfig) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ reminderConfig, onUpdateReminders }) => {
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Account Security</h2>
      </header>
      <div className="bg-white p-20 rounded-[2.5rem] shadow-sm border border-slate-100 text-center text-slate-400 italic">Panel pengaturan keamanan dan profil akun.</div>
    </div>
  );
};

export default AccountSettings;
