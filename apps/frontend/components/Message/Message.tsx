import React, { useEffect } from 'react';
import styles from './Message.module.css';

export type MessageType = 'success' | 'error' | 'warning';

interface MessageProps {
  type: MessageType;
  text: string;
  onClose?: () => void;
}

const icons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#52c41a"/><path d="M6 10.5L9 13.5L14 8.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#ff7875"/><path d="M7 7L13 13M13 7L7 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#faad14"/><path d="M10 6V11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="10" cy="14" r="1" fill="#fff"/></svg>
  ),
};

export const Message: React.FC<MessageProps> = ({ type, text, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.message} ${styles[type]}`}> 
      <span className={styles.icon}>{icons[type]}</span>
      <span className={styles.text}>{text}</span>
    </div>
  );
};

export default Message;
