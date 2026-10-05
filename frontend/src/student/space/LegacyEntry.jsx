import {useCallback} from 'react';
import {Navigate,useLocation} from 'react-router-dom';
import {courseAPI,workAPI,taskAPI} from '../../api';
import useRemote from '../useRemote';
import AsyncPageState from '../../components/common/AsyncPageState';
export default function LegacyEntry(){
 const location=useLocation();const pathname=location.pathname,search=location.search;
 const fetcher=useCallback(async()=>{
  const params=new URLSearchParams(search);let id=params.get('course_id');let suffix;
  const object=pathname.match(/^\/(works|tasks)\/(\d+)$/);
  if(object){const result=await (object[1]==='works'?workAPI.detail:taskAPI.detail)(object[2]);id=(result.work||result.task)?.course_id;suffix=pathname;}
  else if(pathname==='/works/upload'&&params.get('task_id')){const result=await taskAPI.detail(params.get('task_id'));id=result.task.course_id;suffix=pathname;}
  else if(pathname==='/glider'&&id)suffix='/glider';
  else if(pathname==='/dashboard/ai'&&id)suffix='/assistant';
  if(object&&!id)return {to:'/explore',notice:'这条历史记录尚未关联课程，原记录已保留，暂不归入任何课程空间。请联系老师确认归属。'};
  if(!id||!suffix)return {to:'/explore',notice:'请先选择课程，再进入对应的学习空间。'};
  await courseAPI.detail(id);
  return {to:'/courses/'+id+suffix+search+location.hash};
 },[pathname,search,location.hash]);
 const {data,loading,error,retry}=useRemote(fetcher,{courseSensitive:true});
 if(data)return <Navigate to={data.to} replace state={{notice:data.notice}}/>;
 return <AsyncPageState loading={loading} error={error} onRetry={retry}/>;
}
