'use client';

import { Button, buttonVariants } from './button';

type ClientButtonProps = React.ComponentProps<typeof Button>;

export function ClientButton(props: ClientButtonProps) {
  return <Button {...props} />;
}

export { buttonVariants }; 