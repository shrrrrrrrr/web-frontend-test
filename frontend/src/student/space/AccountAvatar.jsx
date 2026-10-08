import {useCallback,useEffect,useRef,useState} from 'react';
import {Modal,Button,Alert} from 'antd';
import client from '../../api/client';
import {useAuth} from '../../store/AuthContext';
import {copyText} from '../../content/copy';
import {requestError} from '../../utils/requestError';
import {nextAsset,accountPresets} from './nextAssets';
import {trapFocus} from '../visual/trapFocus';
export default function AccountAvatar(){
 const {refreshUser}=useAuth(),[data,setData]=useState(null),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const trigger=useRef(null),live=useRef(true),seq=useRef(0),writing=useRef(false);
 const read=useCallback(async()=>{const ticket=++seq.current;try{const r=await client.get('/account/avatar',{silent:true});if(live.current&&ticket===seq.current){setData(r);setNotice('');}}catch(e){if(live.current&&ticket===seq.current)setNotice(requestError(e));}},[]);
 const invalidate=useCallback(()=>{live.current=false;seq.current++;},[]);
 useEffect(()=>{live.current=true;const timer=setTimeout(()=>void read(),0);return()=>{clearTimeout(timer);invalidate();};},[read,invalidate]);
 const save=async presetId=>{
  if(writing.current)return;writing.current=true;setBusy(true);setNotice('');const ticket=++seq.current;let saved=false;
  try{await client.put('/account/avatar',{presetId},{silent:true});saved=true;if(!live.current||ticket!==seq.current)return;setData(s=>({...s,presetId}));await refreshUser();if(live.current&&ticket===seq.current)setNotice(copyText('next.avatar.saved'));}
  catch(e){if(live.current&&ticket===seq.current)setNotice(saved?copyText('next.avatar.uncertain'):requestError(e));}
  finally{writing.current=false;if(live.current&&ticket===seq.current)setBusy(false);}
 };
 const preset=data?.presetId,src=preset?nextAsset('account-'+preset):data?.legacyUrl||nextAsset('account-pilot');
 return <div className="account-avatar"><button ref={trigger} className="account-avatar-trigger" aria-label={copyText('next.avatar.open')} onClick={()=>setOpen(true)}><img src={src} alt="" width={80} height={80} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=nextAsset('account-pilot');}}/><span>{copyText('next.avatar.change')}</span></button>
 {notice&&<Alert type="info" title={notice} action={<Button onClick={()=>void read()}>{copyText('next.retry')}</Button>}/>}
 <Modal open={open} centered title={copyText('next.avatar.open')} footer={null} onCancel={()=>setOpen(false)} rootClassName="student-pixel student-interactions" modalRender={n=><div onKeyDownCapture={trapFocus}>{n}</div>} afterClose={()=>trigger.current?.focus()}>
 <p>{copyText('next.avatar.independent')}</p><div className="account-avatar-grid">{accountPresets.map(id=><button key={id} disabled={busy||!data} aria-label={copyText('next.avatar.'+id)} aria-pressed={preset===id} onClick={()=>void save(id)}><img src={nextAsset('account-'+id)} alt="" width={80} height={80}/><span>{copyText('next.avatar.'+id)}</span></button>)}</div><p role="status">{busy?copyText('next.avatar.saving'):notice}</p><Button onClick={()=>void read()} disabled={busy}>{copyText('next.retry')}</Button></Modal></div>;
}
