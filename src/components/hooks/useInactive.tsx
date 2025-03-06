import { useState, useEffect } from 'react';

export default function useInactive(timeout: number) {
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;

    const handleActivity = () => {
      clearTimeout(timer);
      setIsInactive(false);
      timer = setTimeout(() => setIsInactive(true), timeout);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('focus', handleActivity);
    window.addEventListener('focusin', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('resize', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('drag', handleActivity);
    window.addEventListener('drop', handleActivity);
    window.addEventListener('visibilitychange', handleActivity);

    // Initialize timer on mount
    handleActivity();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('focusin', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('resize', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('drag', handleActivity);
      window.removeEventListener('drop', handleActivity);
      window.removeEventListener('visibilitychange', handleActivity);
    };
  }, [timeout]);

  return isInactive;
}