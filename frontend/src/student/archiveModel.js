// 仅建立学生展示范围。服务端仍须补齐课程授权，不能以此替代接口权限。
const key = (value) => String(value);
const list = (value, name) => {
  if (!Array.isArray(value)) throw new Error(`${name}未能完整读取，请重试。`);
  return value;
};
export const scoreText = (value) => value == null || value === '' ? '暂无评价' : String(value);
export const workDimensions = [['problem_discovery', '问题发现'], ['solution_design', '方案设计'], ['hands_on', '动手操作'], ['data_analysis', '数据分析'], ['presentation', '表达展示']];
export function workStatus(work) {
  if (work.review_status === 'rejected' && work.has_newer_version) return { label: '已修改', tone: 'neutral', revisable: false };
  return ({ approved: { label: '已通过', tone: 'success' }, pending: { label: '待评审', tone: 'current' }, rejected: { label: '需修改', tone: 'warning', revisable: true } })[work.review_status] || { label: '状态待确认', tone: 'neutral' };
}
export function workCounts(works) {
  return { projects: new Set(works.map((work) => key(work.parent_work_id || work.id))).size, iterations: works.filter((work) => work.parent_work_id).length };
}
export function validEnrollments(courses, enrollments) {
  const ids = new Set(list(courses, '课程范围').map((course) => key(course.id)));
  return list(enrollments, '报名关系').filter((row) => ids.has(key(row.course_id)));
}

export function buildStudentArchive(archive, courses, enrollments, studentId) {
  if (key(archive.student?.id) !== key(studentId)) throw new Error('无法确认档案归属，请重新登录后重试。');
  const mapping = new Map(validEnrollments(courses, enrollments).map((row) => [key(row.enrollment_id), row]));
  const courseMap = new Map(courses.map((course) => [key(course.id), course]));
  const courseFor = (row) => {
    const enrollment = mapping.get(key(row.enrollment_id));
    if (!enrollment || (row.course_id != null && key(row.course_id) !== key(enrollment.course_id))) return null;
    if (row.student_id != null && key(row.student_id) !== key(studentId)) return null;
    return courseMap.get(key(enrollment.course_id));
  };
  const filter = (rows, name) => list(rows, name).flatMap((row) => {
    const course = courseFor(row);
    return course ? [{ ...row, course_id: course.id, course_title: course.title }] : [];
  });
  const visibleCourses = filter(archive.courses, '档案课程');
  const rawWorks = list(archive.works, '作品记录');
  const works = filter(rawWorks, '作品记录');
  // 档案 DTO 没有 has_newer_version；只在同一真实版本根内比较版本号。
  const latest = new Map();
  works.forEach((work) => latest.set(key(work.parent_work_id || work.id), Math.max(latest.get(key(work.parent_work_id || work.id)) || 0, work.version || 1)));
  works.forEach((work) => { work.has_newer_version = latest.get(key(work.parent_work_id || work.id)) > (work.version || 1); });
  const reflections = filter(archive.reflections, '反思记录');
  const evaluations = filter(archive.evaluations, '导师评价');
  const workIds = new Set(works.map((work) => key(work.id)));
  const growth = list(archive.growthRecords, '成长记录');
  const events = growth.filter((record) => record.work_id != null ? workIds.has(key(record.work_id)) : record.event_type === 'teacher' && record.recorded_by != null);
  const timeline = [
    ...events.map((record) => ({ id: `event-${record.id}`, at: record.created_at, text: record.description, kind: record.work_id != null ? '作品记录' : '个人成长记录', recorder: record.recorder_name, workId: record.work_id })),
    ...works.filter((work) => !events.some((record) => key(record.work_id) === key(work.id))).map((work) => ({ id: `work-${work.id}`, at: work.created_at, text: `提交作品《${work.title}》 · 第 ${work.version || 1} 版`, kind: '作品提交', workId: work.id })),
    ...reflections.map((row) => ({ id: `reflection-${row.id}`, at: row.created_at, text: row.lesson_title || row.course_title, kind: row.report_id ? '报告反思' : '反思日志', reflection: row })),
  ].sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  return { ...archive, courses: visibleCourses, works, reflections, evaluations, timeline,
    abilityAvailable: rawWorks.length === works.length,
    hiddenEvents: growth.filter((record) => record.work_id == null && !(record.event_type === 'teacher' && record.recorded_by != null)).length,
    counts: { courses: visibleCourses.length, ...workCounts(works), reflections: reflections.length, evaluations: evaluations.length } };
}

export async function loadArchiveScope(api) {
  const [courses, mapping] = await Promise.all([api.courses(), api.enrollments()]);
  return { courses: list(courses.courses, '课程范围'), enrollments: validEnrollments(courses.courses, mapping.enrollments) };
}

export async function loadStudentArchive(api, studentId) {
  // 最多三个并发摘要请求。归属失败拒绝发布；档案失败仍可浏览已核验课程。
  const [scopeResult, archiveResult] = await Promise.allSettled([loadArchiveScope(api), api.archive(studentId)]);
  if (scopeResult.status === 'rejected') throw scopeResult.reason;
  const scope = await loadArchiveScope(api); // 防止读取期间撤回或换报名后的迟到结果。
  if (archiveResult.status === 'rejected') return { ...scope, archive: null, archiveError: archiveResult.reason.response?.data?.error || '档案暂时无法读取，请重试。' };
  return { ...scope, archive: buildStudentArchive(archiveResult.value, scope.courses, scope.enrollments, studentId), archiveError: '' };
}

export function reportSummary(payload) {
  const report = payload.report;
  if (report) return { label: ({ draft: '草稿', submitted: '待评审', approved: '已通过', rejected: '需修改' })[report.status] || '状态待确认', tone: report.status === 'approved' ? 'success' : report.status === 'rejected' ? 'warning' : 'current', report };
  return { label: payload.progress?.report_unlocked ? '尚未提交' : '报告未解锁', tone: 'neutral', report: null };
}
