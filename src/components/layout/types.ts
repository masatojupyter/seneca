type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type LayoutUser = {
  name: string;
  email: string;
  userType: 'ADMIN' | 'WORKER';
};

type AccentColor = 'blue' | 'green';

export type { NavItem, NavGroup, LayoutUser, AccentColor };
