import {useCallback} from 'react';
import {Collapse,Empty,Space} from 'antd';
import {useCourseApis,useCourseNavigate} from '../useCourseApis';
import useRemote from '../useRemote';
import {buildHomeTodos} from '../homeModel';
import {PixelButton,PixelTag} from '../visual/PixelUI';
import PixelIcon from '../visual/PixelIcon';
const reportLabels={approved:'报告已通过',submitted:'报告待评审',rejected:'报告需修改'};
const workLabels={approved:'作品已通过',pending:'作品待评审',rejected:'作品需修改'};
function Todo({ item, primary = false }) {
  const navigate = useCourseNavigate();
  return <div className={`home-todo ${primary ? 'home-todo--primary' : ''}`} data-testid={primary ? 'home-primary-todo' : undefined}>
    <div className="home-todo-copy">
      <h3>{item.title}</h3>
      <p className="home-todo-source">{item.courseTitle} · {item.lessonTitle}</p>
      <Space wrap size={[8, 8]}><PixelTag>课时学习进度 {item.learningProgress}%</PixelTag>
        {reportLabels[item.reportStatus] && <PixelTag tone={item.reportStatus === 'rejected' ? 'warning' : 'neutral'}>{reportLabels[item.reportStatus]}</PixelTag>}
        {workLabels[item.workStatus] && <PixelTag tone={item.workStatus === 'rejected' ? 'warning' : 'neutral'}>{workLabels[item.workStatus]}</PixelTag>}
      </Space>
      <p className="home-todo-description">{item.description}</p>
      {item.taskId && <p className="home-todo-deadline">作品截止：{item.deadline || '未设置'}</p>}
    </div>
    <div className="home-todo-action"><PixelButton type={primary ? 'primary' : 'default'} onClick={() => navigate(item.href)} icon={<PixelIcon name="continue" />}>{item.action}</PixelButton></div>
  </div>;
}


export default function CourseTodos({detail}){
 const {taskAPI}=useCourseApis();const fetcher=useCallback(()=>taskAPI.list(),[taskAPI]);const {data,error,retry}=useRemote(fetcher,{courseSensitive:true,courseId:detail.course.id});
 const todos=buildHomeTodos({courses:[detail.course],courseDetails:[detail],tasks:data?.tasks||[]});
 return <Collapse className="space-course-todos" items={[{key:'todo',label:'下一步 · '+(todos[0]?.action||'查看学习与任务')+(todos.length?'（'+todos.length+'）':''),children:<>{error&&<p role="alert">任务状态读取失败。<button onClick={retry}>重新读取</button></p>}{todos.length?todos.map((item,i)=><Todo key={item.id} item={item} primary={!i}/>):<Empty description="暂无需要处理的待办，可查看课时内容与评审状态。"/>}</>}]} />;
}
