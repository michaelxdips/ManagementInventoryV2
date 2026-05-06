import clsx from 'clsx';

type Props = {
  current: number;
  total: number;
  onChange: (page: number) => void;
};

const Pagination = ({ current, total, onChange }: Props) => {
  if (total <= 1) return null;

  // Smart pagination: show current page with context
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum number of page buttons to show
    
    if (total <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, current - 2);
      let end = Math.min(total - 1, current + 2);
      
      // Adjust if we're near the start
      if (current <= 4) {
        start = 2;
        end = maxVisible - 1;
      }
      
      // Adjust if we're near the end
      if (current >= total - 3) {
        start = total - maxVisible + 2;
        end = total - 1;
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add pages in range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < total - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(total);
    }
    
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination">
      <button
        type="button"
        className="page-btn"
        disabled={current === 1}
        onClick={() => onChange(Math.max(1, current - 1))}
      >
        « Previous
      </button>
      {pages.map((p, idx) => 
        typeof p === 'string' ? (
          <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={clsx('page-number', p === current && 'is-active')}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className="page-btn"
        disabled={current === total}
        onClick={() => onChange(Math.min(total, current + 1))}
      >
        Next »
      </button>
    </div>
  );
};

export default Pagination;
