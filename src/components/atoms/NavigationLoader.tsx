'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NavigationLoader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  // When pathname changes, reset the navigating state
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Function to navigate with transition
  const navigate = (href: string) => {
    setIsNavigating(true);
    startTransition(() => {
      router.push(href);
    });
  };

  // Make the navigate function available globally
  useEffect(() => {
    // Override the default navigation behavior
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && 
          anchor.href && 
          anchor.origin === window.location.origin &&
          !anchor.hasAttribute('data-no-transition') && 
          !e.ctrlKey && 
          !e.metaKey) {
        e.preventDefault();
        navigate(anchor.href);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Show loading indicator when navigating
  if (isPending || isNavigating) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white/80 dark:bg-black/80">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-300 border-t-tertiary-500"></div>
      </div>
    );
  }

  return null;
}