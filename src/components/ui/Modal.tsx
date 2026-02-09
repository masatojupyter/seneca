'use client';

import { HTMLAttributes, forwardRef, ReactNode, useEffect } from 'react';

export type ModalProps = HTMLAttributes<HTMLDivElement> & {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, children, className = '', ...props }, ref) => {
    // Escapeキーでモーダルを閉じる
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={ref}
          className={`relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${className}`}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Compound Components
type ModalComponent = typeof Modal & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
};

export type ModalHeaderProps = HTMLAttributes<HTMLDivElement>;

export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 border-b border-gray-200 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalHeader.displayName = 'ModalHeader';

export type ModalBodyProps = HTMLAttributes<HTMLDivElement>;

export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div ref={ref} className={`px-6 py-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

ModalBody.displayName = 'ModalBody';

export type ModalFooterProps = HTMLAttributes<HTMLDivElement>;

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = 'ModalFooter';

// Attach sub-components to Modal
(Modal as ModalComponent).Header = ModalHeader;
(Modal as ModalComponent).Body = ModalBody;
(Modal as ModalComponent).Footer = ModalFooter;

export default Modal as ModalComponent;
