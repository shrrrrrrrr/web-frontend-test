// 仅在课程负责人确认真实课程 ID、章节名及课时归属后填写。
// 示例结构：{ [courseId]: [{ title, lessonIds: [] }] }；未分组课时始终显示。
export const courseGroups = {};

export const experiments = [
  { id: 'glider', title: '滑翔机模拟实验室', path: '/glider', description: '调整参数、提交试飞，观察自己的飞行结果。' },
];
