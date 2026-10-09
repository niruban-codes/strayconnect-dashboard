import { useState, useCallback } from 'react';
export function useFeedStatus() {
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const fail = useCallback(error => setError(`Unable to load data. ${error?.code === 'permission-denied' ? 'Your account does not have access to these records.' : 'Check your connection and try again.'}`), []);
  const retry = useCallback(() => { setError(''); setRetryKey(value => value + 1); }, []);
  return { error, fail, retry, retryKey };
}
