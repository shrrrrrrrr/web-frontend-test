import {useCallback} from 'react';
import {Link,useSearchParams,useNavigate} from 'react-router-dom';
import {Button} from 'antd';
import {useAuth} from '../../store/AuthContext';
import {courseAPI} from '../../api';
import client from '../../api/client';
import {currentAccessTarget} from '../accessPolicy';
import {safeReturnTo} from '../model';
import {courseIdFromPath} from '../spaceRoutes';
import useRemote from '../useRemote';
import Rewards from '../Rewards';
import PixelIcon from '../visual/PixelIcon';
export default function Personal(){
 const {user,logout}=useAuth(),[params]=useSearchParams(),navigate=useNavigate();
 const source=String(safeReturnTo(params.get('returnTo'),''));const id=String(courseIdFromPath(source)||'');
 const fetcher=useCallback(async()=>{if(!id)return null;await courseAPI.detail(id);const url=new URL(source,'https://local.invalid');const target=currentAccessTarget(url.pathname,url.search);try{if(target.endpoint)await client.get(target.endpoint,{studentAccessProbe:true,silent:true});return {path:source};}catch{return {path:'/courses/'+id,notice:'原位置暂不可访问，可返回课程地图。'};}},[id,source]);const {data,error}=useRemote(fetcher,{courseSensitive:true,courseId:id});
 const safeSource=id&&/^\/courses\/\d+(?:\/(?:lab|glider|archives|reflection|assistant|learn|tasks(?:\/\d+)?|works(?:\/(?:upload|\d+))?|lessons\/\d+\/learn))?(?:[?#].*)?$/.test(source);
 return <div className="space-personal"><header className="space-personal-header"><div><span className="space-eyebrow">我的</span><h1><PixelIcon name="user" size={32}/>{user.real_name||user.username}</h1><p>学生账号 · {user.username}</p></div>{data&&safeSource?<Link to={data.path}>返回来源课程 →</Link>:<Link to="/explore">返回课程选择</Link>}</header>{data?.notice&&<p role="status">{data.notice}</p>}{error&&<p role="status">来源课程暂不可访问，请返回课程选择。</p>}<nav className="space-personal-actions" aria-label="账号与服务"><Link to="/change-password">修改密码</Link><Link to="/notifications">通知</Link><Link to="/feedback">帮助与反馈</Link><Button onClick={()=>{logout();navigate('/login');}}>退出登录</Button></nav><Rewards/></div>;
}
