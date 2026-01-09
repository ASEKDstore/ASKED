'use client';

import { HEADER_HEIGHT_PX } from '@/components/Header';

export default function DocsPage(): JSX.Element {
  return (
    <div
      className="container mx-auto px-4 py-8"
      style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 2rem + env(safe-area-inset-top, 0px))` }}
    >
      <h1 className="text-3xl font-bold mb-6">Доки</h1>
      <p className="text-gray-600">Документация и руководства.</p>
    </div>
  );
}




