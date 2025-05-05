'use client';

import { Toaster as SonnerToaster } from 'sonner';

// Define the props 
type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export function CustomToaster({ ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right" 
      // theme="light" // Maybe needed
      richColors={true} 
      closeButton 
      expand 
      {...props} // Pass any remaining props
    />
  );
}