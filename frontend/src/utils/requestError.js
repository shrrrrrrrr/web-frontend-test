export function requestError(error, { action = '读取', write = false } = {}) {
  if (error?.code === 'AUTH_STORAGE' || error?.code === 'PASSWORD_CHANGED_STORAGE') return error.message;
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return write
    ? action + '请求超时，结果暂未确认。请先重新读取记录，避免重复提交。'
    : action + '请求超时，请检查网络后重试。';
  if (error?.response?.data?.error || error?.response?.data?.message) return error.response.data.error || error.response.data.message;
  if (!error?.response) return write ? action + '未收到服务端确认。请检查网络并先查看记录，再决定是否重试。' : '暂时无法连接服务，请检查网络后重试。';
  return action + '失败，请稍后重试。';
}
export function objectErrorTitle(error, object) {
  return error?.response?.status === 404 ? object + '不存在或已不可访问'
    : error?.response?.status === 403 ? '无权访问这条' + object : object + '暂时无法读取';
}
