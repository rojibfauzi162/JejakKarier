
import React, { useState, useMemo, useEffect } from 'react';
import { ToDoTask } from '../../types';

interface ToDoListProps {
  tasks: ToDoTask[];
  categories: string[];
  onAdd: (task: ToDoTask) => void;
  onUpdate: (task: ToDoTask) => void;
  onDelete: (id: string) => void;
  onAddCategory?: (cat: string) => void;
  onUpdateCategory?: (old: string, next: string) => void;
  onDeleteCategory?: (cat: string) => void;
  targetDate?: string;
}

const ToDoList: React.FC<ToDoListProps> = ({ tasks, categories, onAdd, onUpdate, onDelete, onAddCategory, onUpdateCategory, onDeleteCategory, targetDate }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Growth Checklist</h2>
      </header>
      <div className="bg-white p-20 rounded-[2.5rem] shadow-sm border border-slate-100 text-center text-slate-400 italic">Langkah-langkah strategis pengembangan diri Anda.</div>
    </div>
  );
};

export default ToDoList;
