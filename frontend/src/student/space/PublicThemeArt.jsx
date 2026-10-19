import {useState} from 'react';
import {publicThemes} from './publicThemes';
import {SceneMotion} from '../../motion/Motion';
export default function PublicThemeArt({theme='campus',purpose='desktop',className='',priority=false,motion=true,...props}){
 const [failed,setFailed]=useState(false),item=publicThemes[theme];if(!item||failed)return null;
 const mark=purpose==='mark',cover=purpose==='cover',mobile=purpose==='mobile',source=mark?item.mark:cover?item.cover:(mobile?item.mobile:item.desktop)+'-960.webp';if(!source)return null;
 if(mark||cover||mobile)return <span className={'motion-art'+(mark?' motion-art--mark':cover?' motion-art--cover':'')+' '+className}><img {...props} src={source} loading={priority?'eager':'lazy'} alt="" onError={()=>setFailed(true)}/>{motion&&<SceneMotion theme={theme}/>}</span>;
 return <span className={'space-scene motion-art '+className}><picture className="motion-picture"><source media="(max-width:767px)" srcSet={item.mobile+'-480.webp 480w, '+item.mobile+'-960.webp 960w'} sizes="100vw"/><img {...props} src={source} srcSet={item.desktop+'-480.webp 480w, '+item.desktop+'-960.webp 960w, '+item.desktop+'-1536.webp 1536w'} sizes="100vw" alt="" loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'} onError={()=>setFailed(true)}/></picture>{motion&&<SceneMotion theme={theme}/>}</span>;
}
