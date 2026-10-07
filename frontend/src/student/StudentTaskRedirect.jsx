import Alert from '../student/visual/StudentAlert';
import Sentence from '../content/Sentence';
import {useCourseApis} from './useCourseApis';
import { useCallback } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Link from './space/SpaceLink';

import { Spin } from 'antd';
import { useAuth } from '../store/AuthContext';
import { ServicePage } from '../components/ServiceUI';
import { requestError, objectErrorTitle } from '../utils/requestError';
import { PixelButton, PixelPanel } from './visual/PixelUI';
import useCourseResource from './useCourseResource';
import { validId } from './compatibilityModel';
import './visual/pixel-compatibility.css';

export default function StudentTaskRedirect() {
  const { id } = useParams(), { user } = useAuth();
  return <TaskRedirect key={`${user.id}:${id}`} id={id} />;
}
function TaskRedirect({ id }) {
 const {taskAPI,courseAPI}=useCourseApis();
  const read = useCallback(async () => {
    const data = await taskAPI.detail(id);
    const current = await courseAPI.list();
    if (!(current.courses || []).some(c => String(c.id) === String(data.task.course_id))) throw { response: { status: 404, data: { error: '任务所属课程已不可访问，请返回探索地图。' } } };
    if (!validId(data.task.course_id) || !validId(data.task.lesson_id)) throw new Error('任务的课程或课时信息不完整，请联系老师。');
    return data;
  }, [id,taskAPI,courseAPI]);
  const { data, loading, error, reload } = useCourseResource(read);
  if (data) return <Navigate replace to={`/courses/${data.task.course_id}/lessons/${data.task.lesson_id}/learn`} />;
  return <ServicePage title="打开课后任务" eyebrow="任务入口 / 进入课时" description="核对任务和课程后，将进入对应的课时学习页。">
    <PixelPanel className="compat-redirect"><span className="compat-route-mark" aria-hidden="true">→</span>
      {loading ? <div role="status"><Spin /><h3>正在核对任务…</h3><Sentence>确认后直接进入对应课时。</Sentence></div>
        : <><Alert role="alert" type="warning" title={objectErrorTitle(error, '任务')} description={error?.message || requestError(error)} /><PixelButton type="primary" onClick={reload}>重新读取任务</PixelButton></>}
      <div className="compat-row-actions"><Link to="/tasks">返回任务列表</Link><Link to="/explore">返回探索地图</Link></div>
    </PixelPanel>
  </ServicePage>;
}
