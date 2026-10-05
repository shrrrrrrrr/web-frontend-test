import {useCallback,useState} from 'react';
import {Drawer,Grid} from 'antd';
import {Link,useLocation} from 'react-router-dom';
import {useAuth} from '../../store/AuthContext';
import {courseAPI} from '../../api';
import NotificationBell from '../../components/notifications/NotificationBell';
import RewardProvider from '../RewardProvider';
import {useRewards} from '../useRewards';
import {useCourseId} from '../useCourseApis';
import useRemote from '../useRemote';
import StudentTheme from './StudentTheme';
import PixelIcon from './PixelIcon';
import {PLATFORM_NAME,coursePresentation,asset} from '../space/identity';

function Points({to}){const {data,status}=useRewards();return <Link to={to} className="student-points" data-testid="header-demo-points" aria-label={'演示积分 '+(status==='ready'?data.balance:'读取中')}><PixelIcon name="coin"/><strong>{status==='ready'?data.balance:'—'}</strong><span className="student-demo-tag">演示</span></Link>;}
function CourseNavigation({id,course,close}){
 const {pathname}=useLocation();const theme=coursePresentation(id).theme;
 const entries=[['','map','关卡地图'],['/lab','lab','实验室'],['/archives','archive','成长档案']];
 return <div className="space-course-navigation" data-course-theme={theme}>
   <Link to="/explore" className="space-exit" onClick={close}><PixelIcon name="back"/>返回课程选择</Link>
   <Link to={'/courses/'+id} className="space-course-brand" onClick={close}>{theme==='voyage'?<img src={asset('ship',192)} alt=""/>:<PixelIcon name="book" size={48}/>}<strong>{course?.title||'课程空间'}</strong><span>课程 #{id}</span></Link>
   <nav aria-label="课程导航">{entries.map(([suffix,icon,label])=>{const to='/courses/'+id+suffix;const selected=suffix==='/lab'?/\/(lab|glider)$/.test(pathname):suffix==='/archives'?/\/(archives|works|reflection)(?:\/|$)/.test(pathname):! /\/(lab|glider|archives|works|reflection)(?:\/|$)/.test(pathname);return <Link key={to} to={to} aria-current={selected?'page':undefined} onClick={close}><PixelIcon name={icon}/><span>{label}</span><span aria-hidden="true">›</span></Link>;})}</nav>
   <Link className="space-assistant-link" to={'/courses/'+id+'/assistant'} onClick={close}><PixelIcon name="help"/>灵境小智 · 提问</Link>
   <div className="space-sidebar-art" aria-hidden="true"/>
 </div>;
}
function Shell({children}){
 const id=useCourseId(),{user}=useAuth(),location=useLocation(),screens=Grid.useBreakpoint();
 const [open,setOpen]=useState(false);
 const fetcher=useCallback(()=>id?courseAPI.detail(id):Promise.resolve(null),[id]);
 const {data}=useRemote(fetcher,{courseSensitive:true,courseId:id});
 const me='/me'+(id?'?returnTo='+encodeURIComponent(location.pathname+location.search):'');
 const deep=id&&location.pathname!=='/courses/'+id;
 return <div className={'space-shell student-shell '+(id?'space-shell--course':'space-shell--platform')}>
   {id&&screens.lg&&<aside className="space-sidebar"><CourseNavigation id={id} course={data?.course}/></aside>}
   <div className="space-shell-main">
    <header className="space-header">
      {id?<div className="space-header-context">{!screens.lg&&<button className="space-menu-button" onClick={()=>setOpen(true)} aria-label="打开课程导航" aria-expanded={open}><PixelIcon name="menu"/></button>}<span>{data?.course.title||'课程空间'}</span></div>:<Link className="space-platform-brand" to="/explore"><PixelIcon name="book" size={28}/>{PLATFORM_NAME}</Link>}
      {!id&&<nav className="space-platform-nav" aria-label="平台导航"><Link to="/explore" aria-current={location.pathname==='/explore'?'page':undefined}>课程</Link><Link to="/me" aria-current={location.pathname==='/me'?'page':undefined}>我的</Link></nav>}
      <div className="space-header-actions"><Points to={me}/><NotificationBell icon={<PixelIcon name="notification"/>} buttonClassName="student-notification-button"/><Link to={me} className="space-account" aria-label="我的"><PixelIcon name="user"/><span>{user.real_name||user.username}</span></Link></div>
    </header>
    {deep&&<nav className="space-sticky-return" aria-label="课程返回导航"><Link to={'/courses/'+id}><PixelIcon name="back"/>返回课程地图</Link><Link to="/explore">全部课程</Link></nav>}
    <main id="student-main" className="student-content space-content">{children}</main>
   </div>
   {id&&<Drawer open={!screens.lg&&open} onClose={()=>setOpen(false)} placement="left" width={272} title="课程导航" rootClassName="student-pixel space-navigation-drawer" styles={{body:{padding:0}}}><CourseNavigation id={id} course={data?.course} close={()=>setOpen(false)}/></Drawer>}
 </div>;
}
export default function StudentShell({children}){
 const {user,logout}=useAuth(),id=useCourseId();
 return <StudentTheme variant={id?coursePresentation(id).theme:'campus'}>
  {user.force_reset_password?<div className="forced-shell"><header className="forced-header"><strong>{PLATFORM_NAME} · 账号设置</strong><button onClick={logout}>退出登录</button></header><main id="student-main">{children}</main></div>:<RewardProvider key={user.id} accountId={user.id}><a href="#student-main" className="student-skip-link">跳到页面内容</a><Shell>{children}</Shell></RewardProvider>}
 </StudentTheme>;
}
