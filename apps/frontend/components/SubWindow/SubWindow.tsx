"use client";

import Image from 'next/image';
import styles from './SubWindow.module.css';


const CloseIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const SubWindow = ({
  isOpen,
  onClose,
  title,
  summary,
  imageUrl,
  imageAlt,
  description,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    // The overlay covers the entire screen
    <div className={styles.overlay} onClick={onClose}>
      {/* The main content window that slides up */}
      <div
        className={`${styles.subWindow} ${isOpen ? styles.open : ''}`}
        // Prevents clicks inside the window from closing it
        onClick={(e) => e.stopPropagation()}
      >
        {/* The small grey handle bar at the top */}
        <div className={styles.handleBar}></div>

        {/* Close button */}
        <button onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </button>

        {/* Customizable Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.summary}>{summary}</p>

          {imageUrl && (
            <div className={styles.imageContainer}>
              <Image
                src={imageUrl}
                alt={imageAlt}
                width={500} // Set appropriate dimensions
                height={300} // Set appropriate dimensions
                style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px'
                }}
              />
            </div>
          )}

          <p className={styles.description}>{description}</p>
        </div>
      </div>
    </div>
  );
};

export default SubWindow;