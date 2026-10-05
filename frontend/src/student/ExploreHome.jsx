import {useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Empty,Input} from 'antd';
import {courseAPI} from '../api';
import AsyncPageState from '../components/common/AsyncPageState';
import useRemote from './useRemote';
import {filterCourses} from './homeModel';
import {coursePresentation,safeCoverSource} from './space/identity';
import SceneArt from './space/SceneArt';
import PixelIcon from './visual/PixelIcon';
const readCourses=()=>courseAPI.list();
export default function ExploreHome(){
 const {data,loading,error,retry}=useRemote(readCourses,{courseSensitive:true});const [query,setQuery]=useState('');const location=useLocation();
 const courses=filterCourses(data?.courses||[],query);
 return <div className="space-selector">
  <header className="space-selector-heading"><div><span className="space-eyebrow">我的学习空间</span><h1>选择一门课程</h1><p>课程由老师分配。选择课程，进入它的学习空间。</p></div><Input.Search aria-label="搜索我的课程" placeholder="搜索课程" value={query} onChange={e=>setQuery(e.target.value)} allowClear/></header>
  {location.state?.notice&&<p role="status" className="space-notice">{location.state.notice}</p>}
  <AsyncPageState loading={loading} error={error} onRetry={retry}>
   {!courses.length?<div className="space-empty"><SceneArt name="campus" priority/><div><Empty description={data?.courses?.length?'没有找到匹配课程，请清空搜索。':'老师还没有为你分配已发布的课程，请联系老师。'}/></div></div>:<section className="space-course-selection" aria-label="可进入的课程">{courses.map((course,i)=>{const look=coursePresentation(course.id),cover=safeCoverSource(course.cover_image);return <Link key={course.id} to={'/courses/'+course.id} className="space-course-card" data-testid="home-course-card" aria-label={'进入课程：'+course.title}>
    {cover?<img className="space-real-cover" src={cover} alt="" loading={i?'lazy':'eager'} onError={e=>{e.currentTarget.hidden=true;}}/>:<SceneArt name={look.theme==='voyage'?'cosmos':'campus'} priority={!i}/>}
    <div className="space-course-card-top"><span>课程空间</span>{look.sample&&<span>视觉验收测试课程</span>}</div>
    <div className="space-course-card-copy"><div><h2>{course.title}</h2><p>{course.description||'进入课程，查看课时与学习任务。'}</p></div><span className="space-course-enter">进入课程 <PixelIcon name="continue"/></span></div>
   </Link>;})}</section>}
  </AsyncPageState>
 </div>;
}
