import {useState} from 'react';
import {asset} from './identity';
import {patchAsset} from './visualAssets';
import {SceneMotion} from '../../motion/Motion';
export default function SceneArt({name='campus',alt='',className='',priority=false,vertical=false,patch=false,mobileName,motion=true}){
 const [failed,setFailed]=useState(false);
 const source=patch?patchAsset:asset;
 const theme=name==='cosmos'||name.startsWith('voyage-')?'voyage':'campus';
 return <span className={'space-scene motion-art '+className} data-art-failed={failed||undefined}><picture className="motion-picture">
  {mobileName&&<source media="(max-width: 767px)" srcSet={source(mobileName,480)+' 480w, '+source(mobileName,960)+' 960w'} sizes="100vw"/>}
  {vertical&&<source media="(max-width: 767px)" srcSet={asset('vertical',480)+' 480w, '+asset('vertical',960)+' 960w'} sizes="100vw"/>}
  {!failed&&<img src={source(name,960)} srcSet={name==='ship'?undefined:source(name,480)+' 480w, '+source(name,960)+' 960w, '+source(name,1536)+' 1536w'} sizes="100vw" alt={alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} onError={()=>setFailed(true)}/>}
 </picture>{motion&&!failed&&<SceneMotion theme={theme}/>}</span>;
}
