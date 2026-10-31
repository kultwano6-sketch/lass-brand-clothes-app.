import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isLight } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl transition-all flex items-center gap-2 group ${
        isLight
          ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-200 shadow-sm'
          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
      } ${className}`}
      title={isLight ? 'Switch to Street Dark Mode' : 'Switch to Daylight Mode'}
      aria-label={isLight ? 'Switch to Street Dark Mode' : 'Switch to Daylight Mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isLight ? (
          <Moon className="w-4 h-4 text-orange-500 transition-transform group-hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-bold whitespace-nowrap">
          {isLight ? 'Night Mode' : 'Daylight Mode'}
        </span>
      )}
    </button>
  );
};
