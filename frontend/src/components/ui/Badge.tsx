import { PropsWithChildren } from 'react';
import clsx from 'clsx';

type Variant = 'pending' | 'approved' | 'rejected' | 'neutral' | 'review';

const variantClass: Record<Variant, string> = {
  pending: 'badge badge-pending',
  approved: 'badge badge-approved',
  rejected: 'badge badge-rejected',
  neutral: 'badge badge-neutral',
  review: 'badge badge-review',
};

type Props = PropsWithChildren<{ variant?: Variant; className?: string }>;

const Badge = ({ variant = 'neutral', className, children }: Props) => {
  return <span className={clsx(variantClass[variant], className)}>{children}</span>;
};

export default Badge;
