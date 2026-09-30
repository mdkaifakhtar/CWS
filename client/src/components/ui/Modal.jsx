import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

export const Modal = ({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className={`relative bg-ink-card border border-white/10 rounded-xl2 shadow-cardHover w-full ${maxWidth} max-h-[85vh] flex flex-col`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 className="font-display font-semibold text-lg text-white">{title}</h3>
            <button onClick={onClose} className="focus-ring text-slate-400 hover:text-white p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-5 overflow-y-auto">{children}</div>
          {footer && <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-2">{footer}</div>}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  variant = 'dark',
  requireReason = false,
  reason,
  onReasonChange,
  loading = false,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    maxWidth="max-w-md"
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
          disabled={requireReason && !reason?.trim()}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
    {requireReason && (
      <textarea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        rows={3}
        placeholder="Enter a reason…"
        className="focus-ring w-full bg-ink border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500"
      />
    )}
  </Modal>
);
