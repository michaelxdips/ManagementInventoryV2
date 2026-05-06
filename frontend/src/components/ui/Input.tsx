import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helper?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(({ label, helper, className, id, ...rest }, ref) => {
  return (
    <label className="form-field">
      {label && (
        <span className="form-label">
          {label}
        </span>
      )}
      <input ref={ref} id={id} className={clsx('input-control', className)} {...rest} />
      {helper && <span className="form-helper">{helper}</span>}
    </label>
  );
});

Input.displayName = 'Input';

export default Input;
