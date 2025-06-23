import { ChevronRight } from 'lucide-react';
import styles from './MenuItem.module.css';
import Link from 'next/link';

export const MenuItem = ({ href, children, icon }: { href: string; children: React.ReactNode; icon?: React.ReactNode }) => {
  return (
    <Link href={href} className={styles.menuItem}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.menuItemText}>{children}</span>
      <ChevronRight className={styles.menuIcon}/>
    </Link>
  );
};
