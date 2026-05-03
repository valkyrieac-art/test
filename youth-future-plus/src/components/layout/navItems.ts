import { BarChart3, ClipboardList, Home, ReceiptText, Settings } from 'lucide-react';

export const navItems = [
  { label: '홈', to: '/', icon: Home },
  { label: '활동', to: '/activities', icon: ClipboardList },
  { label: '지출', to: '/expenses', icon: ReceiptText },
  { label: '통계', to: '/stats', icon: BarChart3 },
  { label: '설정', to: '/settings', icon: Settings },
];
