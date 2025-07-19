"use client";

import Image from 'next/image';
import styles from './SubWindow.module.css';
import {faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import React from "react";

interface SubWindowProps {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  summary: string,
  imageUrl: string,
  imageAlt: string,
  description: string,
}

const SubWindow = ({
  isOpen,
  onClose,
  title,
  summary,
  imageUrl,
  imageAlt,
  description,
}: SubWindowProps) => {

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
        <div className={styles.handleBar}/>

        {/* Close button */}
        <button onClick={onClose} className={styles.closeButton}>
          <FontAwesomeIcon icon={faXmark}/>
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