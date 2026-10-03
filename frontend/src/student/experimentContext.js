import { safeReturnTo } from './model.js';

export function learningStage(data) {
  if (!data?.progress?.review_completed) return 0;
  if (!data.progress.cards_done) return 1;
  if (!data.report || data.report.status === 'rejected') return 2;
  return 3;
}

// 沿用原学习页的卡片顺序规则，不增加跨课时门槛。
export function availableCardIndex(cards, cardId, progress) {
  const index = cards.findIndex((card) => String(card.id) === String(cardId));
  return progress?.review_completed && index >= 0 && (index === 0 || cards[index - 1].completed) ? index : -1;
}

export function learningReturnPath({ courseId, lessonId, stage, cardId }) {
  const path = `/courses/${courseId}${lessonId ? `/lessons/${lessonId}/learn` : ''}`;
  const params = new URLSearchParams();
  if (lessonId && Number.isInteger(stage) && stage >= 0 && stage <= 3) params.set('stage', String(stage));
  if (lessonId && stage === 1 && cardId) params.set('cardId', String(cardId));
  return safeReturnTo(`${path}${params.size ? `?${params}` : ''}`);
}

export function associatedExperimentLink(context, experiment = 'glider') {
  if (experiment !== 'glider') return '/lab';
  const params = new URLSearchParams({ course_id: String(context.courseId), returnTo: learningReturnPath(context) });
  if (context.lessonId) params.set('lesson_id', String(context.lessonId));
  return `/glider?${params}`;
}

function denied(error) {
  return [403, 404].includes(error?.response?.status);
}

// 只在进入关联实验 / 返回时读取来源。首页不请求完整学习包。
export async function resolveExperimentReturn(context, api) {
  const { courseId, lessonId } = context;
  const fallback = (path, reason, detail = null) => ({ path, reason, detail, available: false });
  if (!courseId || !/^\d+$/.test(String(courseId))) return fallback('/lab', context.returnTo ? '实验来源无效，已返回实验室。' : '');
  let detail;
  try { detail = await api.course(courseId); }
  catch (error) {
    return fallback('/lab', denied(error) ? '来源课程已撤回或不再分配给你，请在实验室继续自由使用。' : '暂时无法确认来源课程，已返回实验室；网络恢复后可从探索地图重新进入。');
  }
  const mapPath = `/courses/${courseId}`;
  const safePath = safeReturnTo(context.returnTo || learningReturnPath({ courseId, lessonId }), '');
  if (!safePath) return fallback(mapPath, '来源位置无效，已返回可访问的课程地图。', detail);
  const url = new URL(safePath, 'https://local.invalid');
  const match = url.pathname.match(/^\/courses\/(\d+)(?:\/lessons\/(\d+)\/learn)?$/);
  if (!match || match[1] !== String(courseId) || (lessonId ? match[2] !== String(lessonId) : Boolean(match[2]))) {
    return fallback(mapPath, '来源位置与课程或课时不匹配，已返回课程地图。', detail);
  }
  if (!lessonId) return { path: mapPath, available: true, detail, reason: '' };
  if (!(detail.lessons || []).some((lesson) => String(lesson.id) === String(lessonId) && lesson.status !== 'cancelled')) {
    return fallback(mapPath, '来源课时已不可访问，已返回课程地图。', detail);
  }
  let payload;
  try { payload = await api.lesson(lessonId); }
  catch (error) {
    if (denied(error)) {
      // 课时接口失败可能是课程刚撤回；重新确认后再决定能否返回地图。
      try { detail = await api.course(courseId); }
      catch { return fallback('/lab', '来源课程已无法确认访问，已返回实验室。'); }
    }
    return fallback(mapPath, denied(error) ? '来源课时已不可访问，已返回课程地图。' : '暂时无法确认来源课时，已返回课程地图，请稍后重试。', detail);
  }
  if (String(payload.course?.id) !== String(courseId) || String(payload.lesson?.id) !== String(lessonId)) {
    return fallback(mapPath, '来源课时与课程不匹配，已返回课程地图。', detail);
  }
  const stage = url.searchParams.has('stage') ? Number(url.searchParams.get('stage')) : learningStage(payload);
  if (!Number.isInteger(stage) || stage < 0 || stage > learningStage(payload)) {
    return fallback(mapPath, '原学习阶段当前尚未解锁，已返回课程地图，请按现有学习流程继续。', detail);
  }
  const cardId = url.searchParams.get('cardId');
  if (cardId && (stage !== 1 || availableCardIndex(payload.cards || [], cardId, payload.progress) < 0)) {
    return fallback(mapPath, '原知识卡片已不可访问或尚未解锁，已返回课程地图。', detail);
  }
  return { path: learningReturnPath({ courseId, lessonId, stage, cardId }), available: true, detail, payload, reason: '' };
}
