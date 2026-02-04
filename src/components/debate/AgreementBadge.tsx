'use client';

interface AgreementBadgeProps {
  verdict: 'AGREE' | 'DISAGREE';
}

export function AgreementBadge({ verdict }: AgreementBadgeProps) {
  const isAgree = verdict === 'AGREE';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
        isAgree
          ? 'bg-clover-400/20 text-clover-400 border border-clover-400/30'
          : 'bg-rose-400/20 text-rose-400 border border-rose-400/30'
      }`}
    >
      {isAgree ? 'Agrees' : 'Disagrees'}
    </span>
  );
}
