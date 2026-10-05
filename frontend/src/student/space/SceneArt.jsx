import {useState} from 'react';
import {asset} from './identity';
export default function SceneArt({name='campus',alt='',className='',priority=false,vertical=false}){
 const [failed,setFailed]=useState(false);
 return <picture className={'space-scene '+className} data-art-failed={failed||undefined}>
  {vertical&&<source media="(max-width: 767px)" srcSet={asset('vertical',480)+' 480w, '+asset('vertical',960)+' 960w'} sizes="100vw"/>}
  {!failed&&<img src={asset(name,960)} srcSet={name==='ship'?undefined:asset(name,480)+' 480w, '+asset(name,960)+' 960w, '+asset(name,1536)+' 1536w'} sizes="(max-width:767px) 100vw, (max-width:1100px) 80vw, 1200px" alt={alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} onError={()=>setFailed(true)}/>}
 </picture>;
}
