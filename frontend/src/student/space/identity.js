export const PLATFORM_NAME = 'PBL 科创平台';
export const PLATFORM_FONT = "'ChillReunion', 'Microsoft YaHei', sans-serif";
// 独立视觉配置；绝不覆盖 courses.theme（原教学主题）。正式绑定待课程负责人确认。
// 9001 仅由隔离验收夹具创建，不修改初始化示例课程，也不声明为正式教材。
export const COURSE_PRESENTATIONS = Object.freeze({
  9001: { theme: 'voyage', sample: true, groups: [
    {title:'测试章节 A · 观察与记录',lessonIds:[90011,90012,90013]},
    {title:'测试章节 B · 实践与复盘',lessonIds:[90014,90015,90016]},
  ] },
});
export function coursePresentation(id){return COURSE_PRESENTATIONS[id] || {theme:'campus',sample:false,groups:[]};}
export function asset(name,width=960){return '/assets/redesign-v2/web/'+name+'-'+width+'.webp';}

// 封面只接受同站静态资源引用；私有附件仍由服务器鉴权，失败时保留安全底色。
export function safeCoverSource(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes(String.fromCharCode(92)) || [...value].some(c => c.charCodeAt(0) <= 32)) return null;
  try {
    const url = new URL(value, 'https://platform.invalid');
    return url.origin === 'https://platform.invalid' && /^\/(assets|uploads)\//.test(url.pathname) ? url.pathname + url.search : null;
  } catch { return null; }
}
