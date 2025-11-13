import React from 'react';
import Icon from './icons/Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-slate-500 py-16">
      <Icon name={icon} className="text-6xl text-slate-600 mb-4" />
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-slate-400 mt-2 max-w-sm">{message}</p>
    </div>
  );
};

export default EmptyState;
