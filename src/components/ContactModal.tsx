import { useEffect, useState } from 'react';
import { Check, Copy, Mail, X } from 'lucide-react';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const CONTACT_EMAIL = 'yssmi@naver.com';

export default function ContactModal({ open, onClose }: ContactModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B11]/82 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-[#121A26] p-6 md:p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-[#A52A43]">
              CONTACT
            </p>
            <h2
              id="contact-dialog-title"
              className="mt-1.5 text-xl font-display font-semibold text-[#EAE5DC]"
            >
              moodang teacher
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-[#9E988C] hover:text-[#EAE5DC] hover:bg-[#D7D0C3]/10 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A52A43]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#9E988C]">
          프로젝트 협업, 디자인 디렉팅 및 강의 관련 문의는 아래 이메일로 연락해 주세요.
        </p>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-lg bg-[#0C121B]/75 px-4 py-3">
          <span className="text-sm font-medium text-[#D7D0C3] select-all">
            {CONTACT_EMAIL}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#D7D0C3] hover:text-[#EAE5DC] bg-[#D7D0C3]/10 hover:bg-[#D7D0C3]/15 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#A52A43]"
          >
            {copied ? (
              <>
                <Check size={14} className="text-[#D7D0C3]" />
                <span>복사됨</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>복사</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#9E988C] hover:text-[#D7D0C3] transition-colors cursor-pointer"
          >
            닫기
          </button>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#EAE5DC] bg-[#A52A43] hover:bg-[#8C2238] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Mail size={15} aria-hidden="true" />
            <span>메일 보내기</span>
          </a>
        </div>
      </div>
    </div>
  );
}
