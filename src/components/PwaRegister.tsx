'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('SW terdaftar:', reg.scope))
          .catch((err) => console.error('SW gagal daftar:', err));
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
      }
    }
  }, []);

  return null;
}
