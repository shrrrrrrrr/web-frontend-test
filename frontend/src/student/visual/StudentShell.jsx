import { useEffect, useMemo, useState } from 'react';
import { Drawer, Dropdown, Grid } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import NotificationBell from '../../components/notifications/NotificationBell';
import { createRewardAdapter } from '../rewardAdapter';
import { DEMO_REWARDS_CHANGED } from '../rewardEvents';
import StudentTheme from './StudentTheme';
import PixelIcon from './PixelIcon';

const navigation = [
  { to: '/explore', icon: 'map', label: '探索地图', subtitle: '选择课程 · 继续学习' },
  { to: '/lab', icon: 'lab', label: '实验室', subtitle: '提出假设 · 动手验证' },
  { to: '/archives', icon: 'archive', label: '成长档案', subtitle: '记录发现 · 看见成长' },
];

function StudentNavigation({ onNavigate }) {
  const { pathname } = useLocation();
  const selected = pathname.startsWith('/archives') ? '/archives' : /^\/(lab|glider)/.test(pathname) ? '/lab' : '/explore';
  return <>
    <Link to="/explore" className="student-brand" onClick={onNavigate} aria-label="星海远航探索首页">
      <PixelIcon name="map" size={48} />
      <span><strong>星海远航</strong><small>STAR VOYAGE · 2057</small></span>
    </Link>
    <nav className="student-navigation" aria-label="学生主导航">
      {navigation.map((item) => <Link key={item.to} to={item.to} onClick={onNavigate} aria-current={selected === item.to ? 'page' : undefined}>
        <PixelIcon name={item.icon} size={24} />
        <span><strong>{item.label}</strong><small>{item.subtitle}</small></span>
        <span className="student-nav-mark" aria-hidden="true" />
      </Link>)}
    </nav>
    <div className="student-side-note"><span aria-hidden="true">✦</span><p>每一个好问题，<br />都是探索的起点。</p><small>KEEP EXPLORING</small></div>
    <div className="student-sidebar-footer">PBL 科创学习平台</div>
  </>;
}

function DemoPoints() {
  const { user } = useAuth();
  const location = useLocation();
  const adapter = useMemo(() => {
    try { return createRewardAdapter(localStorage, user.id); }
    catch { return null; }
  }, [user.id]);
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    let active = true;
    const read = () => (adapter ? adapter.load() : Promise.reject()).then((data) => { if (active) setSnapshot({ accountId: user.id, balance: data.balance }); })
      .catch(() => { if (active) setSnapshot({ accountId: user.id, balance: null }); });
    read();
    const rewardsChanged = (event) => {
      if (String(event.detail?.accountId) === String(user.id)) read();
    };
    window.addEventListener('focus', read);
    window.addEventListener('storage', read);
    window.addEventListener(DEMO_REWARDS_CHANGED, rewardsChanged);
    return () => {
      active = false;
      window.removeEventListener('focus', read);
      window.removeEventListener('storage', read);
      window.removeEventListener(DEMO_REWARDS_CHANGED, rewardsChanged);
    };
  }, [adapter, user.id, location.key]);
  const balance = snapshot?.accountId === user.id ? snapshot.balance : null;
  return <Link to="/archives/rewards" className="student-points" data-testid="header-demo-points" aria-label={`演示积分${balance === null ? '，查看余额' : ` ${balance}`}，查看积分与徽章`}>
    <PixelIcon name="coin" /><span className="student-points-label">演示积分</span><strong>{balance ?? '—'}</strong><span className="student-demo-tag">演示</span>
  </Link>;
}

function StudentHeader({ compact, navigationOpen, onOpenNavigation }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = () => navigate('/feedback/new', { state: { from: `${location.pathname}${location.search}` } });
  const items = [
    { key: 'identity', disabled: true, label: `${user.real_name || user.username} · 学生` },
    { type: 'divider' },
    { key: 'feedback-new', icon: <PixelIcon name="help" />, label: '帮助与反馈', onClick: feedback },
    { key: 'feedback', label: '我的反馈', onClick: () => navigate('/feedback') },
    { key: 'change-password', label: '修改密码', onClick: () => navigate('/change-password') },
    { key: 'logout', label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
  ];
  return <header className="student-header">
    <div className="student-header-location">{compact
      ? <button type="button" className="student-header-button student-menu-trigger" aria-label="打开导航" aria-expanded={navigationOpen} onClick={onOpenNavigation}><PixelIcon name="menu" /><span>导航</span></button>
      : <span className="student-header-caption">探索 · 实践 · 发现</span>}</div>
    <div className="student-header-actions">
      <DemoPoints />
      <NotificationBell icon={<PixelIcon name="notification" />} buttonClassName="student-notification-button" />
      <button type="button" className="student-header-button student-help" aria-label="帮助与反馈" onClick={feedback}><PixelIcon name="help" /><span>帮助与反馈</span></button>
      <Dropdown trigger={['click']} menu={{ items }} placement="bottomRight">
        <button type="button" className="student-header-button student-profile" aria-label="个人中心"><PixelIcon name="user" /><span>{user.real_name || user.username}</span><PixelIcon name="chevron-down" size={16} /></button>
      </Dropdown>
    </div>
  </header>;
}

function Shell({ children }) {
  const screens = Grid.useBreakpoint();
  const compact = !screens.lg;
  const [navigationOpen, setNavigationOpen] = useState(false);
  return <div className="student-shell">
    {!compact && <aside className="student-sidebar"><StudentNavigation /></aside>}
    <div className="student-shell-main">
      <StudentHeader compact={compact} navigationOpen={navigationOpen} onOpenNavigation={() => setNavigationOpen(true)} />
      <main className="student-content" id="student-main">{children}</main>
    </div>
    <Drawer open={compact && navigationOpen} onClose={() => setNavigationOpen(false)} placement="left" width={264}
      title="探索导航" closable={{ 'aria-label': '关闭导航' }} closeIcon={<PixelIcon name="close" />}
      rootClassName="student-pixel student-navigation-drawer" styles={{ body: { padding: 0, background: '#102D40', color: '#FFF9E9' }, header: { background: '#FFF9E9' } }}>
      <StudentNavigation onNavigate={() => setNavigationOpen(false)} />
    </Drawer>
  </div>;
}

export default function StudentShell({ children }) {
  return <StudentTheme><a href="#student-main" className="student-skip-link">跳到学习内容</a><Shell>{children}</Shell></StudentTheme>;
}
