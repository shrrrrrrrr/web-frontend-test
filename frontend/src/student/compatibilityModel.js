export const validId = value => /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value));
export function sourceAction(source, courseId) {
  if (!validId(source.id) || !validId(courseId)) return null;
  if (source.type === 'resource') return { download: true };
  if (source.type === 'task') return { href: `/tasks/${source.id}`, label: '查看任务' };
  if (['course', 'lesson', 'card'].includes(source.type)) return { href: `/courses/${courseId}`, label: '查看课程地图' };
  return null;
}
export const sourceTypes = { resource: '课堂资料', task: '课后任务', course: '课程', lesson: '课时', card: '知识卡片' };
export const scopeLabels = { core: '课程相关', extension: '课程拓展', unrelated: '问题范围说明' };
export const taskLabels = { pending: '待完成', in_progress: '进行中', submitted: '待导师评审', completed: '学习已完成' };
export const reportLabels = { draft: '草稿', submitted: '待评审', approved: '已通过', rejected: '需修改' };
export function taskGroups(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    const id = String(task.course_id);
    if (!groups.has(id)) groups.set(id, { id, title: task.course_title, tasks: [] });
    groups.get(id).tasks.push(task);
  }
  return [...groups.values()];
}
export function learningPercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}
export function replayDuration(value) {
  const n = Math.floor(Number(value));
  return n > 0 ? `${Math.floor(n / 60)} 分 ${n % 60} 秒` : '';
}
export function courseReadError(error) {
  return [403, 404].includes(error?.response?.status) || (error?.response?.status === 400 && error?.response?.data?.error === '课程不存在')
    ? '课程不存在或已不可访问' : '课程暂时无法读取';
}
