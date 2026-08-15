'use client';

import { useEffect, useState } from 'react';
import DeviceNoticeModal from './DeviceNoticeModal';

export default function DeviceNoticeProvider() {
  const [showNotice, setShowNotice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if this is a mobile device
    const isMobileDevice = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Check if notice has been dismissed in this session
    const noticeShown = sessionStorage.getItem('device_notice_shown');
    
    if (isMobileDevice() && !noticeShown) {
      setIsMobile(true);
      // Delay showing the modal slightly for better UX
      setTimeout(() => {
        setShowNotice(true);
      }, 500);
    }
  }, []);

  const handleClose = () => {
    setShowNotice(false);
    sessionStorage.setItem('device_notice_shown', 'true');
  };

  const handleContinue = () => {
    setShowNotice(false);
    sessionStorage.setItem('device_notice_shown', 'true');
  };

  return (
    <DeviceNoticeModal 
      isOpen={showNotice && isMobile}
      onClose={handleClose}
      onContinue={handleContinue}
    />
  );
}
