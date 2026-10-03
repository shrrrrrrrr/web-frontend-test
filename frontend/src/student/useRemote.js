import { useCallback, useEffect, useState } from 'react';

export default function useRemote(fetcher) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    // 清空旧数据：错误状态下不退回显示上次成功结果。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ loading: true, data: null, error: '' });
    fetcher().then((data) => { if (active) setState({ loading: false, data, error: '' }); })
      .catch((error) => { if (active) setState({ loading: false, data: null,
        error: error.response?.data?.error || error.message || '网络连接失败，请重试。' }); });
    return () => { active = false; };
  }, [fetcher, attempt]);
  return { ...state, retry };
}
