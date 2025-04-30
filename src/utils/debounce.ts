type DebouncedFunction<T extends (...args: any[]) => void> = {
  (...args: Parameters<T>): void;
  cancel: () => void; 
};

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null; // Initialize as null or keep as NodeJS.Timeout

  // The main debounced function
  const debounced = (...args: Parameters<T>): void => {
    // Clear any existing timeout
    if (timeout !== null) {
        clearTimeout(timeout);
    }
    // Set a new timeout
    timeout = setTimeout(() => {
        timeout = null; 
        func(...args);
    }, wait);
  };

  // Add the cancel method to the returned function object
  debounced.cancel = (): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null; // Clear the stored timeout ID when cancelled
    }
  };


  return debounced;
}