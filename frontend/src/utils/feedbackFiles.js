export const FEEDBACK_MAX_FILES = 3;
export const FEEDBACK_MAX_SIZE = 10 * 1024 * 1024;
const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf' };
export function feedbackFileError(file, count) {
  if (count >= FEEDBACK_MAX_FILES) return '最多选择 3 个附件。已选择的文件已保留，请移除后再添加。';
  const extension = file.name?.split('.').at(-1)?.toLowerCase();
  if (!mime[extension] || mime[extension] !== file.type) return '文件扩展名与类型需匹配：PNG、JPG/JPEG、WEBP 或 PDF；不支持 GIF。';
  if (file.size > FEEDBACK_MAX_SIZE) return '单个附件不能超过 10 MiB。';
  return '';
}
export const studentFeedbackModules = { auth: '登录与密码', dashboard: '探索入口', courses: '课程学习', students: '账号信息', works: '作品提交', archives: '成长档案', assistant: '学习助手', other: '其他' };
