
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onReset?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, onReset }) => {
  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 md:px-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 border-b pb-4 border-slate-200">
        <h1 className="text-2xl font-bold text-indigo-700">{title}</h1>
        {onReset && (
          <button 
            onClick={onReset}
            className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            처음으로
          </button>
        )}
      </header>
      <main className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-10 border border-slate-100">
        {children}
      </main>
      <footer className="mt-8 text-slate-400 text-xs">
        © 2024 Performance Feedback Expert System. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
