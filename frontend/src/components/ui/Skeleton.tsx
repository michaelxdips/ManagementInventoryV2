import type { CSSProperties } from 'react';

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  rounded?: 'sm' | 'md' | 'lg' | 'full';
};

const radiusMap = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  full: '999px',
};

export const Skeleton = ({ className = '', style, width, height, rounded = 'md' }: SkeletonProps) => (
  <span
    aria-hidden="true"
    className={`skeleton ${className}`.trim()}
    style={{ width, height, borderRadius: radiusMap[rounded], ...style }}
  />
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="skeleton-stack" aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        height={12}
        rounded="full"
        style={{ width: index === lines - 1 ? '68%' : '100%' }}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="skeleton-card" aria-hidden="true">
    <Skeleton height={18} width="55%" rounded="full" />
    <SkeletonText lines={3} />
    <div className="skeleton-row">
      <Skeleton height={32} width={96} rounded="full" />
      <Skeleton height={32} width={96} rounded="full" />
    </div>
  </div>
);

export const SkeletonTableRows = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex} className="skeleton-table-row" aria-hidden="true">
        {Array.from({ length: columns }).map((__, columnIndex) => (
          <td key={columnIndex}>
            <Skeleton height={12} width={columnIndex === 0 ? 36 : '80%'} rounded="full" />
          </td>
        ))}
      </tr>
    ))}
  </>
);
