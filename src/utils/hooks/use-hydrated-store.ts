import { useState, useEffect } from 'react';

export const useHydratedStore = <T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  selector: (state: T) => F,
) => {
  const result = store(selector) as F;
  const [data, setData] = useState<F | undefined>(undefined);

  useEffect(() => {
    setData(result);
  }, [result]);

  return data;
};
