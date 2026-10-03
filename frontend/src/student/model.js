// 展示层排序和分组不产生新的解锁条件或进度。
export function groupLessons(lessons, config = []) {
  const remaining = new Map(lessons.map((lesson) => [String(lesson.id), lesson]));
  const groups = config.map((group) => ({
    title: group.title,
    lessons: group.lessonIds.flatMap((id) => {
      const lesson = remaining.get(String(id));
      remaining.delete(String(id));
      return lesson ? [lesson] : [];
    }),
  })).filter((group) => group.lessons.length);
  if (remaining.size) groups.push({ title: config.length ? '其他课时' : '课程课时', lessons: [...remaining.values()] });
  return groups;
}

export function safeReturnTo(value, fallback = '/lab') {
  if (typeof value !== 'string' || value.includes('\\') || [...value].some((char) => char.charCodeAt(0) <= 32) || /%2f|%5c/i.test(value)) return fallback;
  if (!/^\/courses\/\d+(?:\/lessons\/\d+\/learn|\/learn)?(?:[?#]|$)/.test(value)) return fallback;
  try {
    const url = new URL(value, 'https://local.invalid');
    return url.origin === 'https://local.invalid' ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}

export function draftKey(userId, courseId, lessonId) {
  if (!userId || !courseId || !lessonId) throw new Error('草稿缺少账号或课时');
  return `star-voyage:report:v1:${userId}:${courseId}:${lessonId}`;
}
