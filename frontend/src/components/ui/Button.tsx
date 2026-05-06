import { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost' | 'danger' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

const sizeClass: Record<Size, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  secondary: 'btn-secondary',
};

const Button = ({ children, className, variant = 'primary', size = 'md', fullWidth = false, ...rest }: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      className={clsx('btn-base', sizeClass[size], variantClass[variant], fullWidth && 'btn-block', className)}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
