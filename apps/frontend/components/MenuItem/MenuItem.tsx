import { ChevronRight } from 'lucide-react';
import styles from './MenuItem.module.css';
import Link from 'next/link';

export const MenuItem = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <Link href={href} className={styles.menuItem}>
      <span className={styles.menuItemText}>{children}</span>
      <ChevronRight className={styles.menuIcon}/>
    </Link>
  );
};
