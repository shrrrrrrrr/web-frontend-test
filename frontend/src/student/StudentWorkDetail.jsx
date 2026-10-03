import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Select } from 'antd';
import { courseAPI, workAPI } from '../api';
import { useAuth } from '../store/AuthContext';
import { formatBeijingTime } from '../utils/date';
import PageContainer from '../components/common/PageContainer';
import AsyncPageState from '../components/common/AsyncPageState';
import useRemote from './useRemote';
import { PixelButton, PixelTag } from './visual/PixelUI';
import { StudyHeader, StudySection } from './visual/StudyUI';
import PixelIcon from './visual/PixelIcon';

const dimensions = [['problem_discovery', '问题发现'], ['solution_design', '方案设计'], ['hands_on', '动手操作'], ['data_analysis', '数据分析'], ['presentation', '表达展示']];
const fileSize = (bytes) => bytes == null ? '未知' : bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

export default function StudentWorkDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fetcher = useCallback(async () => {
    const payload = await workAPI.detail(id);
    // 原作品接口只校验本人归属，课程发布/报名状态须由现有课程接口再次确认。
    if (!payload.work.course_id) throw new Error('作品未关联当前可访问的课程，请联系老师核对。');
    try { await courseAPI.detail(payload.work.course_id); }
    catch (error) {
      if ([403, 404].includes(error.response?.status)) throw new Error('该作品所属课程已不可访问，作品内容已清除。请返回探索地图查看可进入的课程。', { cause: error });
      throw error;
    }
    return payload;
  }, [id]);
  const { data, loading, error, retry } = useRemote(fetcher, { courseSensitive: true });
  const [downloadError, setDownloadError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const work = data?.work;
  const review = data?.review;
  const versions = data?.versions || [];
  const revised = work?.review_status === 'rejected' && work.has_newer_version;
  const status = revised ? '已修改' : work?.review_status === 'approved' ? '已通过' : work?.review_status === 'rejected' ? '需修改' : '待评审';
  const canRevise = work && String(work.student_id) === String(user.id) && work.review_status === 'rejected' && !work.has_newer_version;
  const download = async () => {
    setDownloading(true); setDownloadError('');
    try {
      const blob = await workAPI.download(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = work.file_name || '作品附件'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err.response?.status === 404 ? '附件暂不可用，文件可能已移除。你仍可查看作品文字、历史版本和导师反馈。' : '附件下载失败，请检查网络后重试。作品内容仍保留在本页。');
    } finally { setDownloading(false); }
  };
  return <PageContainer><div className="study-workspace">
    <StudyHeader eyebrow={<><PixelIcon name="archive" />{work?.course_title || '作品记录'}</>} title={work?.title || '作品详情'} description={work?.task_title}>
      <PixelButton icon={<PixelIcon name="back" />} onClick={() => navigate('/works')}>返回我的作品</PixelButton>
      {work?.course_id && <PixelButton onClick={() => navigate(`/courses/${work.course_id}`)}>返回课程地图</PixelButton>}
    </StudyHeader>
    <AsyncPageState loading={loading} error={error === 'Network Error' ? '网络连接失败，请检查连接后重新加载。' : error} onRetry={retry}>
      {work && <div className="study-detail-layout"><div>
        <StudySection number="W" title="作品内容" description="每一次提交都保留自己的内容和反馈。">
          <PixelTag tone={status === '已通过' ? 'success' : status === '需修改' ? 'warning' : 'current'}>{status}</PixelTag>
          <div className="study-detail-meta"><span>第 {work.version || 1} 版</span><span>提交于 {formatBeijingTime(work.created_at)}</span><span>{work.student_name}</span></div>
          {revised && <Alert type="info" showIcon title="此版本已修改" description="已有更新版本，请在版本记录中切换查看。旧版本不再开放重新提交。" />}
          <p className="study-prose">{work.description || '本版未填写成果文字，请查看附件。'}</p>
          <section className="study-subsection" aria-label="作品附件"><h4>作品附件</h4>
            {work.has_file ? <><p className="study-prose">{work.file_name || '作品附件'}</p><div className="study-attachment-info"><span>类型：{work.file_name?.includes('.') ? work.file_name.split('.').pop().toUpperCase() : work.file_type || '未知'}</span><span>大小：{fileSize(work.file_size)}</span></div>
              {downloadError && <Alert type="warning" showIcon title="附件下载失败" description={downloadError} style={{ marginTop: 12 }} />}
              <PixelButton type="primary" loading={downloading} onClick={download} style={{ marginTop: 16 }}>下载附件</PixelButton>
            </> : <p className="study-help">本版没有附件，作品以成果文字提交。</p>}
          </section>
        </StudySection>
        <StudySection number="F" title="导师反馈" description={`以下反馈对应第 ${work.version || 1} 版。`}>
          {review || work.reject_reason ? <div className={`study-feedback${work.review_status === 'rejected' ? ' study-feedback--rejected' : ''}`}>
            {review?.reviewer_name && <p className="study-help">评审导师：{review.reviewer_name}</p>}
            <h4>导师评语</h4><p className="study-prose">{review?.comment || '导师暂未留下评语。'}</p>
            <h4>修改建议</h4><p className="study-prose">{review?.suggestion || work.reject_reason || '暂无修改建议。'}</p>
            {review && work.review_status === 'approved' && <ul className="study-scores">{dimensions.map(([key, label]) => <li key={key}><span>{label}</span><strong>{review[key] == null ? '未评分' : `${review[key]} 分`}</strong></li>)}</ul>}
          </div> : <Alert showIcon type="info" title={work.review_status === 'pending' ? '作品正在等待导师评审' : '暂无导师反馈'} description="可以回到课时继续学习；报告与作品的评审分别进行。" />}
          {canRevise && <div className="study-actions"><PixelButton type="primary" onClick={() => navigate(`/works/upload?parent_work_id=${work.id}&task_id=${work.task_id || ''}&enrollment_id=${work.enrollment_id || ''}`)}>修改后重新提交</PixelButton></div>}
        </StudySection>
      </div><aside className="study-context" aria-label="作品版本记录"><h3>作品版本</h3>
        <div className="study-version-control"><label htmlFor="student-work-version">切换历史版本</label><Select id="student-work-version" value={Number(id)} onChange={(value) => navigate(`/works/${value}`)} options={versions.map((version) => ({ value: version.id, label: `第 ${version.version || 1} 版` }))} /></div>
        <dl><dt>所属课程</dt><dd>{work.course_title || '未关联课程'}</dd><dt>作品任务</dt><dd>{work.task_title || '未关联任务'}</dd><dt>当前版本状态</dt><dd>{status}</dd></dl>
        <p>只有最新版本被导师退回，才可以提交修改后的作品。历史版本与原反馈会保留。</p>
      </aside></div>}
    </AsyncPageState>
  </div></PageContainer>;
}
