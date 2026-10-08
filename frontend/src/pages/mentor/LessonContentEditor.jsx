import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm,
  Select, Space, Switch, Tag, Typography, message,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { learningManageAPI } from '../../api';
import {copyText} from '../../content/copy';
import PageContainer from '../../components/common/PageContainer';
import AsyncPageState from '../../components/common/AsyncPageState';

const blankCard = { status: 'draft', is_required: true, estimated_minutes: 10 };
const statusLabel = { draft: '草稿·学生不可见', published: '已发布', archived: '已归档' };
const typeLabel = { single_choice: '单选题', multiple_choice: '多选题', true_false: '判断题', fill_blank: '填空题', short_answer: '简答题' };

export default function LessonContentEditor({embeddedCourseId,embeddedLessonId,onBusyChange}) {
  const params=useParams();const courseId=embeddedCourseId||params.courseId,lessonId=embeddedLessonId||params.lessonId;
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [editing, setEditing] = useState(null);
  const [exerciseCard, setExerciseCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving,setSaving]=useState(false),[saveError,setSaveError]=useState(''),[saved,setSaved]=useState(false),[savedExerciseId,setSavedExerciseId]=useState(null);
  const live=useRef(true),seq=useRef(0),busy=useRef(false),exerciseIdentity=useRef(null),exerciseRevision=useRef(null);
  // seq is a request counter; cleanup deliberately invalidates outstanding reads.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{live.current=true;return()=>{live.current=false;seq.current++;};},[]);
  useEffect(()=>{onBusyChange?.(saving);return()=>onBusyChange?.(false);},[saving,onBusyChange]);
  const [cardForm] = Form.useForm();
  const [exerciseForm] = Form.useForm();

  const load = async () => {
    setLoading(true); setError('');
    const ticket=++seq.current;try { const result=await learningManageAPI.cards(lessonId);if(live.current&&ticket===seq.current)setCards(result.cards||[]);return true; }
    catch (err) { if(live.current&&ticket===seq.current){setCards([]);setError(err?.response?.data?.error || '无法加载课时内容');}return false; }
    finally { if(live.current&&ticket===seq.current)setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lessonId]);

  const openCard = (card = blankCard) => {
    setSaveError('');setSaved(false);cardForm.resetFields();setEditing(card);
    cardForm.setFieldsValue({ ...card, is_required: Boolean(card.is_required) });
  };
  const saveCard = async (status) => {
    const values=await cardForm.validateFields();if(busy.current)return;busy.current=true;setSaving(true);setSaveError('');
    try {
      const payload={...values,status,...(editing?.content_revision?{expected_revision:editing.content_revision}:{})};
      const result=editing?.id?await learningManageAPI.updateCard(editing.id,payload):await learningManageAPI.createCard(lessonId,payload);
      if(!live.current)return;
      setEditing(current=>({...current,...payload,id:result.id,content_revision:result.content_revision}));setSaved(true);
      if(!await load())setSaveError(copyText('next2.save.readFailed'));
    } catch(err){if(live.current)setSaveError(err?.response?.data?.error||copyText('next2.save.failed'));}
    finally{busy.current=false;if(live.current)setSaving(false);}
  };
  const publishCard = async (cardId) => {
    await learningManageAPI.updateCard(cardId, { status: 'published',expected_revision:cards.find(c=>c.id===cardId)?.content_revision });
    message.success('知识卡片已发布，学生现在可以学习');
    await load();
  };
  const saveExercise = async (values) => {
    const options = values.options_text ? values.options_text.split('\n').map((value) => value.trim()).filter(Boolean) : [];
    let answer = values.answer;
    if (values.question_type === 'multiple_choice') answer = String(answer).split(',').map((value) => value.trim()).filter(Boolean);
    if (values.question_type === 'true_false') answer = String(answer) === 'true';
    if(busy.current)return;busy.current=true;setSaving(true);setSaveError('');
    try{const payload={...values,options,answer,max_attempts:1,...(exerciseRevision.current?{expected_revision:exerciseRevision.current}:{})};const result=exerciseIdentity.current?await learningManageAPI.updateExercise(exerciseIdentity.current,payload):await learningManageAPI.createExercise(exerciseCard.id,payload);if(!live.current)return;exerciseIdentity.current=result.id;exerciseRevision.current=result.content_revision;setSavedExerciseId(result.id);setSaved(true);if(!await load())setSaveError(copyText('next2.save.exerciseReadFailed'));}
    catch(err){if(live.current)setSaveError(err?.response?.data?.error||copyText('next2.save.failed'));}
    finally{busy.current=false;if(live.current)setSaving(false);}
  };

  return <PageContainer
    title="课时内容编辑"
    description="知识卡片默认保存为学生不可见的草稿；内容与答案详解确认后再发布。"
    extra={!embeddedCourseId&&<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/courses/${courseId}`)}>返回课程</Button>}
  >
    <p>{copyText('next2.guide.card')}</p><Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => openCard()}>新增知识卡片</Button>
    <AsyncPageState loading={loading} error={error} onRetry={load} empty={!cards.length} emptyText="尚未创建知识卡片">
      {cards.map((card, index) => <Card
        className="content-card"
        key={card.id}
        style={{ marginBottom: 16 }}
        title={<Space wrap><span>{index + 1}. {card.title}</span><Tag color={card.status === 'published' ? 'green' : 'default'}>{statusLabel[card.status] || card.status}</Tag>{card.is_required ? <Tag color="blue">必修</Tag> : <Tag>选修</Tag>}</Space>}
        extra={<Space wrap>
          {card.status === 'draft' && <Button type="primary" onClick={() => publishCard(card.id)}>发布给学生</Button>}
          <Button onClick={() => openCard(card)}>编辑</Button>
          <Button onClick={() => { exerciseIdentity.current=null;exerciseRevision.current=null;setSaved(false);setSaveError('');setExerciseCard(card); exerciseForm.resetFields(); }}>添加练习</Button>
          <Popconfirm title="确认删除或归档该卡片？" onConfirm={async () => { await learningManageAPI.deleteCard(card.id); load(); }}><Button danger>删除</Button></Popconfirm>
        </Space>}
      >
        <Typography.Paragraph type="secondary">{card.summary || '暂无摘要'}</Typography.Paragraph>
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{card.content}</Typography.Paragraph>
        {(card.exercises || []).length === 0
          ? <Alert type="warning" showIcon message="尚未配置配套练习" />
          : (card.exercises || []).map((exercise) => <Card size="small" key={exercise.id} style={{ marginTop: 8 }}><Space wrap><Tag>{typeLabel[exercise.question_type]}</Tag><span>{exercise.prompt}</span><Tag>一次作答</Tag><Popconfirm title="确认删除该练习？" onConfirm={async () => { await learningManageAPI.deleteExercise(exercise.id); load(); }}><Button type="link" danger>删除</Button></Popconfirm></Space></Card>)}
      </Card>)}
    </AsyncPageState>

    <Modal open={Boolean(editing)} title={editing?.id ? '编辑知识卡片' : '新增知识卡片'} onCancel={() => {if(!busy.current)setEditing(null);}} closable={!saving} maskClosable={!saving} footer={null} width={720} destroyOnHidden>
      <Form form={cardForm} layout="vertical" disabled={saving} onValuesChange={()=>setSaved(false)}>{saveError&&<Alert type="warning" title={saveError}/>}{saved&&<Alert type="success" title={copyText('next2.save.saved')+' #'+editing?.id}/>}
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写卡片标题' }]}><Input /></Form.Item>
        <Form.Item name="summary" label="摘要"><Input.TextArea /></Form.Item>
        <Form.Item name="content" label="正文" rules={[{ required: true, message: '请填写卡片正文' }]}><Input.TextArea rows={7} /></Form.Item>
        <Form.Item name="key_points" label="关键要点"><Input.TextArea /></Form.Item>
        <Form.Item name="common_mistakes" label="常见误区"><Input.TextArea /></Form.Item>
        <Space wrap><Form.Item name="estimated_minutes" label="预计分钟"><InputNumber min={1} max={600} /></Form.Item><Form.Item name="is_required" label="必修" valuePropName="checked"><Switch /></Form.Item></Space>
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}><Button disabled={saving} onClick={() => setEditing(null)}>取消</Button><Button loading={saving} disabled={saved} onClick={() => saveCard('draft')}>保存草稿</Button><Button type="primary" loading={saving} disabled={saved} onClick={() => saveCard('published')}>保存并发布</Button></Space>
      </Form>
    </Modal>

    <Modal open={Boolean(exerciseCard)} title={`添加练习 · ${exerciseCard?.title || ''}`} closable={!saving} maskClosable={!saving} onCancel={() => {if(!busy.current)setExerciseCard(null);}} onOk={() => exerciseForm.submit()} confirmLoading={saving} okButtonProps={{disabled:saved}} destroyOnHidden>
      <Form form={exerciseForm} layout="vertical" initialValues={{ question_type: 'single_choice', points: 1, is_required: true }} onValuesChange={()=>setSaved(false)} disabled={saving} onFinish={saveExercise}>{saveError&&<Alert type="warning" title={saveError}/>}{saved&&<Alert type="success" title={'已保存 #'+savedExerciseId}/>}
        <Alert type="info" showIcon message="每位学生每道题只有一次作答机会；提交后将立即看到标准答案详解。" style={{ marginBottom: 16 }} />
        <Form.Item name="question_type" label="题型" rules={[{ required: true }]}><Select options={Object.entries(typeLabel).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item name="prompt" label="题目" rules={[{ required: true, message: '请填写题目' }]}><Input.TextArea /></Form.Item>
        <Form.Item name="options_text" label="选项（选择题每行一个）"><Input.TextArea /></Form.Item>
        <Form.Item name="answer" label="标准答案（多选用英文逗号分隔）" rules={[{ required: true, message: '请填写标准答案' }]}><Input /></Form.Item>
        <Form.Item name="explanation" label="答案详解" rules={[{ required: true, message: '请填写学生作答后看到的答案详解' }]}><Input.TextArea rows={4} showCount maxLength={5000} /></Form.Item>
      </Form>
    </Modal>
  </PageContainer>;
}
