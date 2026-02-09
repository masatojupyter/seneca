'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { NavGroup, AccentColor } from '@/components/layout/types';
import { Badge } from '@/components/ui';
import { XMarkIcon } from '@/components/layout/nav-icons';

type DashboardSidebarProps = {
  navGroups: NavGroup[];
  accentColor: AccentColor;
  isOpen: boolean;
  onClose: () => void;
};

const ACTIVE_STYLES: Record<AccentColor, string> = {
  blue: 'bg-blue-50 text-blue-700 font-medium',
  green: 'bg-green-50 text-green-700 font-medium',
};

const DEFAULT_ITEM_STYLE = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

export function DashboardSidebar({
  navGroups,
  accentColor,
  isOpen,
  onClose,
}: DashboardSidebarProps): React.JSX.Element {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarBrand onClose={onClose} />
        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {navGroups.map((group) => (
            <SidebarGroup
              key={group.title}
              group={group}
              accentColor={accentColor}
              pathname={pathname}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function SidebarBrand({ onClose }: { onClose: () => void }): React.JSX.Element {
  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
      <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-green-500 bg-clip-text text-transparent">
        Seneca
      </span>
      <button
        onClick={onClose}
        className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        aria-label="Close sidebar"
      >
        <XMarkIcon />
      </button>
    </div>
  );
}

function SidebarGroup({
  group,
  accentColor,
  pathname,
}: {
  group: NavGroup;
  accentColor: AccentColor;
  pathname: string;
}): React.JSX.Element {
  const t = useTranslations('common');

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
        {group.title}
      </p>
      <ul className="space-y-1">
        {group.items.map((item) => {
          const isActive =
            pathname === item.href || (item.href.split('/').length > 3 && pathname.startsWith(item.href));
          const style = isActive ? ACTIVE_STYLES[accentColor] : DEFAULT_ITEM_STYLE;

          if (item.disabled) {
            return (
              <li key={item.href}>
                <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed">
                  {item.icon}
                  {item.label}
                  <Badge className="ml-auto text-[10px]">{t('comingSoon')}</Badge>
                </span>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${style}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
