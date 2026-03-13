export function extractApiErrorMessage(error, fallback = 'Something went wrong.') {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        if (item?.msg) {
          return item.msg;
        }
        return null;
      })
      .filter(Boolean)
      .join('. ');
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string' && detail.message.trim()) {
      return detail.message;
    }
    if (typeof detail.msg === 'string' && detail.msg.trim()) {
      return detail.msg;
    }
  }

  return fallback;
}
