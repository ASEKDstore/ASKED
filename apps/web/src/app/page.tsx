'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="z-10 w-full max-w-2xl items-center text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">ASKED Miniapp</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to the ASKED Miniapp monorepo
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/profile">
            <Button>View Profile</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

