import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import styles from './BackButton.module.css';

interface BackButtonProps {
  href: string;
  pageName: string;
}

const BackButton: React.FC<BackButtonProps> = ({ href, pageName }) => {
  return (
    <Link href={href} className={styles.backButton}>
      <FontAwesomeIcon icon={faChevronLeft} />
      <span className={styles.pageName}>{pageName}</span>
    </Link>
  );
};

export default BackButton;