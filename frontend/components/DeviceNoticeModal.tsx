import { useState, useEffect } from 'react';
import { FaDesktop, FaCheckCircle, FaTimes } from 'react-icons/fa';

interface DeviceNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function DeviceNoticeModal({ isOpen, onClose, onContinue }: DeviceNoticeModalProps) {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-sky-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-sky-100 px-6 py-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cmblue-50">
              <FaDesktop className="h-6 w-6 text-cmblue-600" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-950">Optimize Your Experience</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="mb-4 text-sm text-slate-700">
            This platform is optimized for desktop for the full experience. On mobile, some features may be limited.
          </p>

          <div className="space-y-2 rounded-xl bg-sky-50 p-4">
            <div className="flex items-start gap-2">
              <FaCheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <p className="text-xs text-slate-700">Access all features on desktop</p>
            </div>
            <div className="flex items-start gap-2">
              <FaCheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <p className="text-xs text-slate-700">Better performance and responsiveness</p>
            </div>
            <div className="flex items-start gap-2">
              <FaCheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <p className="text-xs text-slate-700">Improved security and wallet integration</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-sky-100 px-6 py-4 flex gap-3">
          <button
            onClick={() => {
              setShow(false);
              onClose();
            }}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <FaTimes className="mr-2 inline-block h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            onClick={() => {
              setShow(false);
              onContinue();
            }}
            className="flex-1 rounded-lg bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)] hover:shadow-[0_16px_36px_rgba(0,130,255,0.32)] transition-all"
          >
            <FaCheckCircle className="mr-2 inline-block h-3.5 w-3.5" />
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
