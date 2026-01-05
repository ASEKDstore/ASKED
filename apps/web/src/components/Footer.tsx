'use client';

export function Footer(): JSX.Element {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

  return (
    <footer className="w-full border-t bg-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <div className="mb-2 sm:mb-0">
            <span>Developed by </span>
            <span className="font-semibold text-gray-900">ASKED LAB</span>
          </div>
          <div>
            <span className="text-gray-500">Version {appVersion}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}



