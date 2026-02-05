
import React, { useMemo } from 'react';
import { AppData } from '../../types';
import { LiveThemeRenderer } from './OnlineCVBuilder';

interface OnlineCVViewProps {
  slug: string;
  initialData: AppData;
}

const OnlineCVView: React.FC<OnlineCVViewProps> = ({ slug, initialData }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-20 text-center text-slate-400 italic">
      Tampilan publik Digital Portfolio Anda.
    </div>
  );
};

export default OnlineCVView;
