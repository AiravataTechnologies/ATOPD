export interface NavigationItem {
  href: string;
  icon: string;
  label: string;
  isActive?: boolean;
}

export interface QuickStat {
  label: string;
  value: string | number;
}
