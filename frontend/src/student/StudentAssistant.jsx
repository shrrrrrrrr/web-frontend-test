import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Input, Select, Spin } from 'antd';
import { aiAPI } from '../api';
import { useAuth } from '../store/AuthContext';
import { requestError } from '../utils/requestError';
import { ServicePage } from '../components/ServiceUI';
import { STUDENT_COURSES_CHANGED } from './accessPolicy';
import { PixelButton, PixelPanel, PixelTag, PixelImage } from './visual/PixelUI';
import { pixelImageProps } from './visual/pixelAssets';
import { scopeLabels, sourceAction, sourceTypes } from './compatibilityModel';
import CourseResourceDownload from './CourseResourceDownload';
import './visual/pixel-compatibility.css';

export default function StudentAssistant() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const requested = params.get('course_id') || '';
  return <AssistantSession key={`${user.id}:${user.role}:${requested}`} requested={requested} />;
}
function AssistantSession({ requested }) {
  const [catalog, setCatalog] = useState({ loading: true, error: null, enabled: null, courses: [] });
  const [courseId, setCourseId] = useState(null), [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]), [waiting, setWaiting] = useState(false), [notice, setNotice] = useState('');
  const [unseen, setUnseen] = useState(false);
  const live = useRef(false), selected = useRef(null), queryUsed = useRef(false), allowed = useRef(null);
  const readSequence = useRef(0), askSequence = useRef(0), inFlight = useRef(false), messageId = useRef(0);
  const reader = useRef(null), input = useRef(null), nearBottom = useRef(true), shouldScroll = useRef(false);
  const clearContext = useCallback((next, reason = '') => {
    askSequence.current++; inFlight.current = false; selected.current = next;
    setCourseId(next); setChat([]); setWaiting(false); setNotice(reason); setUnseen(false);
  }, []);
  const loadCourses = useCallback(async () => {
    const ticket = ++readSequence.current;
    setCatalog(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await aiAPI.getCourses();
      if (!live.current || ticket !== readSequence.current) return;
      const courses = (data.courses || []).filter(c => !allowed.current || allowed.current.has(String(c.id)));
      setCatalog({ loading: false, error: null, enabled: Boolean(data.enabled), courses });
      if (selected.current != null && !courses.some(c => String(c.id) === String(selected.current))) {
        clearContext(null, '当前课程已不可访问，已清除该课程的回答与引用。尚未发送的文字仍保留，请重新选择课程。');
      }
      if (!queryUsed.current) {
        queryUsed.current = true;
        const match = courses.find(c => String(c.id) === requested);
        if (match) clearContext(match.id);
        else if (requested) setNotice('链接中的课程不可用于提问。请选择一门可进入的课程。');
      }
    } catch (error) { if (live.current && ticket === readSequence.current) setCatalog(s => ({ ...s, loading: false, error })); }
  }, [requested, clearContext]);
  const invalidate = useCallback(() => { live.current = false; readSequence.current++; askSequence.current++; }, []);
  useEffect(() => {
    live.current = true;
    const timer = setTimeout(() => { void loadCourses(); }, 0);
    const changed = ({ detail }) => {
      allowed.current = new Set(detail.courses.map(c => String(c.id)));
      if (selected.current != null && !allowed.current.has(String(selected.current))) {
        queryUsed.current = true;
        clearContext(null, '当前课程已不可访问，已清除该课程的回答与引用。尚未发送的文字仍保留，请重新选择课程。');
      }
      setCatalog(s => ({ ...s, courses: s.courses.filter(c => allowed.current.has(String(c.id))) }));
      void loadCourses();
    };
    window.addEventListener(STUDENT_COURSES_CHANGED, changed);
    return () => { invalidate(); clearTimeout(timer); window.removeEventListener(STUDENT_COURSES_CHANGED, changed); };
  }, [loadCourses, clearContext, invalidate]);
  useEffect(() => {
    if (!shouldScroll.current || !reader.current) return;
    shouldScroll.current = false;
    reader.current.scrollTo({ top: reader.current.scrollHeight, behavior: 'instant' });
  }, [chat, waiting]);
  const toLatest = () => { reader.current?.scrollTo({ top: reader.current.scrollHeight, behavior: 'instant' }); nearBottom.current = true; setUnseen(false); };
  const ask = async () => {
    const value = question.trim();
    if (!value || value.length > 1000 || inFlight.current || !catalog.enabled || catalog.loading || catalog.error || selected.current == null) return;
    inFlight.current = true;
    const ticket = ++askSequence.current, contextId = selected.current, id = ++messageId.current;
    setQuestion(''); setWaiting(true); setNotice(''); setUnseen(false); shouldScroll.current = true; nearBottom.current = true;
    setChat(items => [...items, { id, question: value }]); input.current?.focus();
    try {
      const result = await aiAPI.ask(value, contextId);
      if (!live.current || ticket !== askSequence.current) return;
      shouldScroll.current = nearBottom.current;
      setUnseen(!nearBottom.current);
      setChat(items => items.map(item => item.id === id ? { ...item, result, courseId: contextId } : item));
    } catch (error) {
      if (!live.current || ticket !== askSequence.current) return;
      const code = error.response?.data?.code;
      if (code === 'AI_ACCESS_CHANGED' || error.response?.status === 403) {
        clearContext(null, `${requestError(error)}。已清除原课程上下文，请重新选择课程。`);
        queryUsed.current = true; void loadCourses();
      } else {
        // 服务错误是独立操作反馈；保留原问题，不覆盖等待期间的新草稿。
        setChat(items => items.map(item => ({ ...item,
          ...(code === 'AI_CONTEXT_CHANGED' && item.result ? { result: { ...item.result, sources: [] }, outdated: true } : {}),
          ...(item.id === id ? { error } : {}),
        })));
        shouldScroll.current = nearBottom.current; setUnseen(!nearBottom.current);
      }
    } finally { if (live.current && ticket === askSequence.current) { inFlight.current = false; setWaiting(false); } }
  };
  const activeCourse = catalog.courses.find(c => String(c.id) === String(courseId));
  const ready = catalog.enabled && !catalog.loading && !catalog.error && courseId != null;
  return <ServicePage title="灵境小智" eyebrow="学习伙伴 / 课程提问" description="把遇到的问题说完整，一起找到下一步的思路。" actions={<Link to="/explore">返回探索地图</Link>}>
    <div className="assistant-layout">
      <PixelPanel className="assistant-context">
        <div className="assistant-guide"><PixelImage {...pixelImageProps('companion-cat', '72px')} alt="" /><div><PixelTag tone="current">学习伙伴</PixelTag><h3>课程提问</h3></div></div>
        <label htmlFor="assistant-course">当前课程</label>
        <Select id="assistant-course" aria-label="当前课程" placeholder="选择一门课程" value={courseId} onChange={id => clearContext(id)} disabled={catalog.loading || !!catalog.error || !catalog.enabled}
          options={catalog.courses.map(c => ({ value: c.id, label: c.title }))} optionRender={option => <span>{option.label} <small>· 课程 {option.value}</small></span>} />
        {catalog.loading ? <p role="status"><Spin size="small" /> 正在读取可提问课程…</p>
          : catalog.error ? <Alert role="alert" type="error" title="可提问课程读取失败" description={requestError(catalog.error)} action={<PixelButton onClick={loadCourses}>重新读取课程</PixelButton>} />
            : !catalog.enabled ? <Alert type="info" title="灵境小智暂未启用" description="请联系老师了解开放时间。" />
              : !catalog.courses.length ? <p role="status">暂无可提问课程。课程由老师分配，开放后会显示在这里。</p>
                : !courseId && <p>选择课程后就可以发送问题。</p>}
        {activeCourse && <Link className="assistant-map-link" to={`/courses/${activeCourse.id}`}>打开当前课程地图 →</Link>}
        <details className="assistant-boundary"><summary>提问方式与使用说明</summary><p>说说你正在做什么、遇到了什么困难，以及已经尝试的方法。</p><p>每次只发送本次问题。这里的问答仅保留在当前页面，切课或离开后清除。</p><p>回答可能包含课程拓展。课程要求以实际资料为准，请结合证据作出自己的判断。</p></details>
      </PixelPanel>
      <PixelPanel className="assistant-workbench">
        <header className="assistant-reader-heading"><h3>问答记录</h3><span>本页临时记录</span></header>
        {notice && <Alert role="status" type="warning" title={notice} />}
        <div className="assistant-reader" ref={reader} tabIndex={0} aria-label="问答阅读区" onScroll={() => { const el = reader.current; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 72; if (nearBottom.current) setUnseen(false); }}>
          {!chat.length && <div className="assistant-empty"><span aria-hidden="true">?</span><h4>从一个具体问题开始</h4><p>可以询问课程知识、任务要求，或整理下一步的探究思路。</p></div>}
          {chat.map(item => <article className="assistant-turn" key={item.id}>
            <div className="assistant-question"><strong>我的问题</strong><p>{item.question}</p></div>
            {item.result && <div className="assistant-answer"><div className="compat-tags"><strong>{item.result.origin === 'provider' ? 'AI 服务回复' : '服务回复'}</strong>{scopeLabels[item.result.scope] && <PixelTag>{scopeLabels[item.result.scope]}</PixelTag>}</div><p>{item.result.answer}</p>
              {item.outdated && <p className="compat-muted">课程资料已有变化，旧引用已移除。请重新提问以取得当前依据。</p>}
              {!!item.result.sources?.length && <section className="assistant-sources" aria-label="回答参考资料"><h4>参考资料</h4><ul>{item.result.sources.map((source, i) => {
                const action = sourceAction(source, item.courseId);
                return <li key={`${source.ref}:${i}`}><div><strong>{source.ref && `[${source.ref}] `}{source.title || '未命名资料'}</strong><p>{sourceTypes[source.type] || '其他来源'}{source.locator ? ` · ${source.locator}` : ''}</p></div>
                  {action?.download ? <CourseResourceDownload resource={source} courseId={item.courseId} /> : action?.href ? <Link to={action.href} aria-label={`${action.label}：${source.title || '资料'}`}>{action.label}</Link> : <span className="compat-muted">暂无可用入口</span>}</li>;
              })}</ul></section>}
            </div>}
            {item.error && <div className="assistant-failure"><Alert role="alert" type="warning" title="本次未取得回答" description={requestError(item.error, { action: '提问' })} />
              <PixelButton disabled={!!question.trim()} onClick={() => { setQuestion(item.question); input.current?.focus(); }}>将原问题放回输入框</PixelButton>
              <p>{question.trim() ? '输入框里已有文字，原问题仍保留在上方，可复制后继续编辑。' : '编辑后由你决定是否再次发送。'}</p>
              {item.error.response?.data?.request_id && <details><summary>错误诊断信息</summary><code>{item.error.response.data.request_id}</code></details>}
            </div>}
          </article>)}
          {waiting && <div className="assistant-waiting" role="status"><Spin size="small" /> 正在等待服务回复，请稍候…</div>}
        </div>
        {unseen && <PixelButton onClick={toLatest}>查看最新回复</PixelButton>}
        <form className="assistant-composer" onSubmit={event => { event.preventDefault(); void ask(); }}>
          <label htmlFor="assistant-question">我想问</label><p className="compat-footnote">每次只发送本次问题；课程要求以实际资料为准。</p>
          <Input.TextArea ref={input} id="assistant-question" value={question} placeholder="请写下完整的问题…" maxLength={1000} rows={3} onChange={event => setQuestion(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); void ask(); } }} />
          <div className="assistant-composer-footer"><span>{question.trim().length} / 1000 字 · Shift + Enter 换行</span><PixelButton type="primary" htmlType="submit" loading={waiting} disabled={!ready || !question.trim() || waiting}>发送问题</PixelButton></div>
        </form>
      </PixelPanel>
    </div>
  </ServicePage>;
}
