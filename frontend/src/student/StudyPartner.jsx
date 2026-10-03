import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PixelButton, PixelImage } from './visual/PixelUI';
import PixelIcon from './visual/PixelIcon';

export default function StudyPartner() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = location.pathname.match(/^\/courses\/(\d+)/)?.[1];
  return <aside className={`student-partner${collapsed ? ' student-partner--collapsed' : ''}`} aria-label="学习伙伴">
    {collapsed ? <button type="button" className="student-partner-open" onClick={() => setCollapsed(false)}><PixelIcon name="cat" />打开学习伙伴</button> : <>
      <div className="student-partner-intro">
        <PixelImage className="student-partner-image" src="/assets/pixel-v1/companion-cat.png" alt="原创像素小猫学习伙伴" width={1254} height={1254} fallback={<PixelIcon name="cat" size={48} />} />
        <div><strong>学习伙伴 · 灵境小智</strong><p>需要一点思路？一起理清下一步。</p></div>
      </div>
      <div className="student-partner-actions">
        <PixelButton aria-label="向灵境小智提问" onClick={() => navigate(`/dashboard/ai${courseId ? `?course_id=${courseId}` : ''}`)}><span className="student-partner-ask-full">向灵境小智提问</span><span className="student-partner-ask-short">提问</span></PixelButton>
        <button type="button" className="student-partner-close" aria-label="收起学习伙伴" onClick={() => setCollapsed(true)}><PixelIcon name="close" size={16} /><span>收起</span></button>
      </div>
    </>}
  </aside>;
}
