import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const Select = forwardRef<HTMLSelectElement, Props>(({ label, className, id, children, ...rest }, ref) => {
  return (
    <label className="form-field">
      {label && (
        <span className="form-label">
          {label}
        </span>
      )}
      <select ref={ref} id={id} className={clsx('input-control', className)} {...rest}>
        {children}
      </select>
    </label>
  );
});

Select.displayName = 'Select';

export default Select;
