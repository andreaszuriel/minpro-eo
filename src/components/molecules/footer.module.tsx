'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component from your UI library

export default function Footer() {
  const { data: session, status } = useSession();

  return (
    <footer className="bg-primary-700 text-font-color-dark mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-xl font-display font-bold mb-4">EventHub</h2>
            <p className="text-secondary-200">Your premier event management platform</p>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-secondary-200">
              <li>
                <a href="/about" className="hover:text-tertiary-400">
                  About
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-tertiary-400">
                  Contact
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-tertiary-400">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-secondary-200">
              <li>
                <a href="/terms" className="hover:text-tertiary-400">
                  Terms
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-tertiary-400">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* User Session Section */}
        <div className="mt-8 pt-8 border-t border-primary-600 text-center text-secondary-300">
          {status === 'loading' ? (
            <p>Loading...</p>
          ) : session ? (
            <div className="space-y-2">
              <p>Greetings, {session.user.email}!</p>
              <Button
                variant="outline"
                className="bg-primary-600 text-secondary-200 hover:bg-primary-500"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <p>Not signed in</p>
          )}
          <p className="mt-4">© {new Date().getFullYear()} EventHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}