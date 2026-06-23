import React from 'react';
import BrandLogo from '../auth/BrandLogo';

interface AppFooterProps {
  siteName?: string;
}

export default function AppFooter({ siteName = 'Azeebo+' }: AppFooterProps): React.JSX.Element {
  return (
    <footer
      className="border-t py-12"
      style={{ borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#0d0505' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <BrandLogo variant="orange" />
            <p className="text-white/50 text-sm mt-4 max-w-xs leading-relaxed">
              The home of Nigerian entertainment. Stream, vote, earn, and celebrate culture.
            </p>
          </div>
          {[
            { heading: siteName, items: ['About', 'Careers', 'Press'] },
            { heading: 'Help', items: ['Support', 'FAQ', 'Contact'] },
            { heading: 'Legal', items: ['Terms', 'Privacy', 'Cookies'] },
          ].map((col) => (
            <div key={col.heading}>
              <h4 className="font-bold text-white text-sm mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/50 hover:text-[#E8420A] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-12 pt-8 border-t text-center text-sm text-white/40"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p>&copy; 2026 {siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
