import {useState} from 'react';
import {asset} from './identity';

// Visual locations cycle with the real route order. They do not name lessons,
// assign chapters or imply any learning/prerequisite rule.
const places = [
  {art:'moon-base',x:'50%',y:'65%'},
  {art:'orbital-berth',x:'50%',y:'68%'},
  {art:'asteroid-outpost',x:'53%',y:'66%'},
];

export default function LessonPlace({number,current,selected,completed,priority,theme}) {
  const [failed,setFailed] = useState(false);
  const place = places[(number-1)%places.length];
  const voyage = theme==='voyage';
  return <span className="space-lesson-place" data-place={voyage?place.art:'campus'} data-place-failed={failed||undefined}
    style={{'--landing-x':place.x,'--landing-y':place.y}} aria-hidden="true">
    {voyage && !failed && <img className="space-place-art" src={asset(place.art,192)} srcSet={`${asset(place.art,192)} 192w, ${asset(place.art,384)} 384w`} sizes="(max-width:767px) 210px, 220px" alt="" width="192" height="192" loading={priority?'eager':'lazy'} onError={()=>setFailed(true)}/>}
    {failed && <span className="space-place-fallback">场景图暂不可用</span>}
    <span className="space-landing-anchor" />
    <span className="space-place-number">{String(number).padStart(2,'0')}</span>
    {current && <span className="space-place-current">当前学习</span>}
    {selected && <span className="space-place-selection">详情</span>}
    {completed && <span className="space-place-complete">✓</span>}
  </span>;
}
