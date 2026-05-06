import { PropsWithChildren } from 'react';
import clsx from 'clsx';

type TableProps = PropsWithChildren<{ className?: string }>;

type TableCellProps = PropsWithChildren<{ className?: string } & React.ThHTMLAttributes<HTMLTableCellElement>>;

type TableRowProps = PropsWithChildren<{ className?: string } & React.HTMLAttributes<HTMLTableRowElement>>;

type TableBodyProps = PropsWithChildren<{ className?: string }>;

type TableHeaderProps = PropsWithChildren<{ className?: string }>;

export const Table = ({ children, className }: TableProps) => (
  <div className="table-shell">
    <table className={clsx('items-table', className)}>{children}</table>
  </div>
);

export const THead = ({ children, className }: TableHeaderProps) => <thead className={className}>{children}</thead>;

export const TBody = ({ children, className }: TableBodyProps) => <tbody className={className}>{children}</tbody>;

export const TR = ({ children, className, ...rest }: TableRowProps) => (
  <tr className={className} {...rest}>
    {children}
  </tr>
);

export const TH = ({ children, className, ...rest }: TableCellProps) => (
  <th className={clsx(className)} {...rest}>
    {children}
  </th>
);

export const TD = ({ children, className, ...rest }: TableCellProps) => (
  <td className={clsx(className)} {...rest}>
    {children}
  </td>
);
