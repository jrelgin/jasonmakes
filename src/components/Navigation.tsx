'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  return (
    <nav className="py-6 mb-8 border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="text-xl font-semibold hover:text-blue-600 transition-colors">
              Jason Elgin
            </Link>
          </div>
          <ul className="flex space-x-8">
            <li>
              <Link 
                href="/articles" 
                className={`hover:text-blue-600 transition-colors ${
                  pathname?.startsWith('/articles') ? 'text-blue-600 font-medium' : ''
                }`}
              >
                Articles
              </Link>
            </li>
            <li>
              <Link 
                href="/case-studies" 
                className={`hover:text-blue-600 transition-colors ${
                  pathname?.startsWith('/case-studies') ? 'text-blue-600 font-medium' : ''
                }`}
              >
                Case Studies
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
