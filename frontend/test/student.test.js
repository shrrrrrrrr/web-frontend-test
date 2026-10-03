import test from 'node:test';
import assert from 'node:assert/strict';
import { groupLessons, nextTask, safeReturnTo, experimentLink, draftKey } from '../src/student/model.js';
import { createDemoRewardAdapter } from '../src/student/rewardAdapter.js';
import { canRoleAccessPath, homeForRole } from '../src/utils/roleNavigation.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('章节不会丢失未配置课时，不重复出现或自动解锁', () => {
  const lessons = [{ id: 1, progress: 0 }, { id: 2, progress: 60 }, { id: 3, progress: 100 }];
  const result = groupLessons(lessons, [{ title: '已确认分组', lessonIds: [2, 99] }, { title: '重复分组', lessonIds: [2] }]);
  assert.deepEqual(result.map((group) => group.lessons.map((lesson) => lesson.id)), [[2], [1, 3]]);
  assert.equal(result[0].lessons[0].progress, 60);
});
test('待办优先退回修改，不把待评审和已完成再次列入闯关', () => {
  assert.equal(nextTask([{ id: 1, status: 'pending' }, { id: 2, status: 'submitted' }, { id: 3, status: 'in_progress', report_status: 'rejected' }]).id, 3);
  assert.equal(nextTask([{ status: 'completed' }, { status: 'submitted' }]), undefined);
});
test('实验返回仅接受站内课程链接', () => {
  for (const url of ['//evil.test', 'https://evil.test', '/\\evil.test', 'javascript:alert(1)', '/courses/1%2f/evil', '/courses/1/../../login', '/courses/1\n']) assert.equal(safeReturnTo(url), '/lab', url);
  assert.equal(safeReturnTo('/courses/1/lessons/2/learn?stage=2#report'), '/courses/1/lessons/2/learn?stage=2#report');
  assert.ok(experimentLink(1, 2, '/courses/1').includes('lesson_id=2'));
});
test('草稿键按账号、课程、课时隔离', () => {
  assert.notEqual(draftKey(1, 2, 3), draftKey(2, 2, 3));
  assert.notEqual(draftKey(1, 2, 3), draftKey(1, 2, 4));
  assert.throws(() => draftKey(null, 2, 3));
});
test('学生新旧路由兼容，其他角色首页不变', () => {
  assert.equal(homeForRole('student'), '/explore');
  assert.equal(homeForRole('teacher'), '/observer');
  for (const path of ['/explore', '/lab', '/archives/rewards', '/dashboard', '/courses/1', '/tasks/2', '/works/3', '/notifications/4']) assert.ok(canRoleAccessPath('student', path));
  assert.equal(canRoleAccessPath('teacher', '/archives/rewards'), false);
  assert.equal(canRoleAccessPath('student', '/mentor/reviews'), false);
});
test('演示兑换扣减、幂等、记录、限制和账号隔离', async () => {
  const storage = memoryStorage();
  const a = createDemoRewardAdapter(storage, 1);
  const b = createDemoRewardAdapter(storage, 2);
  await a.redeem('notebook', 'request-1');
  await a.redeem('notebook', 'request-1');
  assert.equal((await a.load()).balance, 80);
  assert.equal((await a.load()).records.length, 1);
  assert.equal((await a.load()).ledger[0].amount, -40);
  assert.equal((await b.load()).balance, 120);
  await a.redeem('notebook', 'request-2');
  await assert.rejects(a.redeem('notebook', 'request-3'), /上限/);
  await assert.rejects(a.redeem('model', 'request-4'), /还差/);
  await assert.rejects(a.redeem('sticker', 'request-5'), /库存/);
  assert.equal((await a.load()).balance, 40);
  await a.reset();
  assert.equal((await a.load()).balance, 120);
});
test('存储失败不能伪造兑换成功', async () => {
  const adapter = createDemoRewardAdapter({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, 1);
  await assert.rejects(adapter.redeem('notebook', 'failure'), /保存失败/);
  assert.equal((await adapter.load()).balance, 120);
});
