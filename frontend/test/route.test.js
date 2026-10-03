import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCourseRoute, currentLesson, scheduleTime } from '../src/student/routeModel.js';

const lessons = [
  { id: 11, sort_order: 2, progress: 25 },
  { id: 10, sort_order: 1, progress: 100 },
  { id: 12, sort_order: 3, progress: 0 },
  { id: 13, sort_order: 4, status: 'cancelled' },
  { id: 14, sort_order: 5, progress: 0 },
];

test('地图按服务端课时顺序编号，分组不丢未归属课时', () => {
  const groups = buildCourseRoute(lessons, [{ title: '测试A', lessonIds: [11, 10] }, { title: '测试B', lessonIds: [12, 13] }]);
  assert.deepEqual(groups.map((group) => group.lessons.map((lesson) => [lesson.id, lesson.routeNumber])), [ [[10, 1], [11, 2]], [[12, 3], [13, 4]], [[14, 5]] ]);
  assert.equal(lessons[0].id, 11, '不修改接口原数组');
});

test('当前节点优先合法来源，其次进行中；不产生跨课时门槛', () => {
  assert.equal(currentLesson(lessons)?.id, 11);
  assert.equal(currentLesson(lessons, 14)?.id, 14, '后面的课时可以直接进入');
  assert.equal(currentLesson(lessons, 13)?.id, 11, '取消课时不会标为当前');
  assert.equal(currentLesson([{ id: 1, progress: 100 }]), null);
});

test('章节不连续时分成连续区域，连线不会跳过中间未分组课时', () => {
  const groups = buildCourseRoute(lessons, [{ title: '测试A', lessonIds: [10, 12] }]);
  assert.deepEqual(groups.flatMap((group) => group.lessons.map((lesson) => lesson.id)), [10, 11, 12, 13, 14]);
  assert.deepEqual(groups.map((group) => group.title), ['测试A', '其他课时', '测试A', '其他课时']);
  assert.equal(new Set(groups.map((group) => group.key)).size, groups.length);
});

test('排课时间不擅自转换时区，缺失值显示待安排', () => {
  assert.equal(scheduleTime('2026-10-10T14:00'), '2026-10-10 14:00');
  assert.equal(scheduleTime(null), '待安排');
});
