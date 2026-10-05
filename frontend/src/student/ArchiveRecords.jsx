import { Empty, Pagination } from 'antd';
import Link from './space/SpaceLink';

import { useState } from 'react';
import { formatBeijingTime } from '../utils/date';
import { workStatus } from './archiveModel';
import { PixelTag } from './visual/PixelUI';
import PixelIcon from './visual/PixelIcon';

export function WorkRecords({ works, compact = false }) {
  const [page, setPage] = useState(1);
  if (!works.length) return <Empty description="暂无作品记录；完成课时中的作品任务后会出现在这里。" />;
  const current = Math.min(page, Math.ceil(works.length / 8));
  const visible = compact ? works.slice(0, 5) : works.slice((current - 1) * 8, current * 8);
  return <><ul className="archive-work-list" aria-label="作品记录">{visible.map((work) => {
    const status = workStatus(work);
    return <li key={work.id} className="archive-work-row">
      <span className="archive-file-icon" aria-hidden="true"><PixelIcon name="book" /></span>
      <div className="archive-work-main"><Link className="archive-record-title" to={`/works/${work.id}`}>{work.title}</Link><p>{work.course_title || '课程未命名'}{work.task_title ? ` · ${work.task_title}` : ''}</p><p>第 {work.version || 1} 版 · {formatBeijingTime(work.created_at)}</p></div>
      <PixelTag tone={status.tone}>{status.label}</PixelTag>
      <Link className="archive-record-action" to={`/works/${work.id}`}>{status.revisable ? '查看反馈并修改' : '查看作品与反馈'}</Link>
    </li>;
  })}</ul>{!compact && works.length > 8 && <Pagination current={current} pageSize={8} total={works.length} onChange={setPage} showSizeChanger={false} />}</>;
}

export function ReflectionFields({ reflection }) {
  return <dl className="archive-reflection-fields">{[['difficulty', '遇到的困难'], ['solution', '解决方式'], ['improvement', '改进收获'], ['new_question', '新问题']].map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{reflection[field] || '未填写'}</dd></div>)}</dl>;
}
