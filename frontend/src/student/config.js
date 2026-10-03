// 仅在课程负责人确认真实课程 ID、章节名及课时归属后填写。
// 示例结构：{ [courseId]: [{ title, lessonIds: [] }] }；未分组课时始终显示。
export const courseGroups = {};

// 仅用于自动化验收的合成课程；普通启动与生产构建不会启用。
export const testCourseGroups = {
  1: [
    { title: '测试章节 A · 观察与记录', lessonIds: [1, 2] },
    { title: '测试章节 B · 实践与回顾', lessonIds: [3, 4] },
  ],
};

export const studentTestConfigEnabled = import.meta.env.DEV && import.meta.env.VITE_STUDENT_TEST_CONFIG === '1';
export function groupsForCourse(courseId) {
  return (studentTestConfigEnabled ? testCourseGroups : courseGroups)[courseId] || [];
}

export const experiments = [
  { id: 'glider', title: '滑翔机模拟实验室', path: '/glider', description: '调整参数、提交试飞，观察自己的飞行结果。' },
];
