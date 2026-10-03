import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, Form, Input, Button, Typography, message, Space, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { archiveAPI, courseAPI } from '../../api';
import { STUDENT_COURSES_CHANGED } from '../../student/accessPolicy';

const { Title, Text } = Typography;

export default function Reflection() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [accessNotice, setAccessNotice] = useState('');
  const lessonRequest = useRef(0);
  const accessibleCoursesRef = useRef(null);

  useEffect(() => {
    archiveAPI.getReflections().then((res) => {
      setEnrollments((res.enrollments || []).filter((enrollment) => !accessibleCoursesRef.current || accessibleCoursesRef.current.has(String(enrollment.course_id))));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const updateCourses = ({ detail }) => {
      accessibleCoursesRef.current = new Set(detail.courses.map((course) => String(course.id)));
      const removed = new Set(detail.removedCourseIds.map(String));
      const selected = enrollments.find((enrollment) => enrollment.enrollment_id === form.getFieldValue('enrollment_id'));
      setEnrollments((current) => current.filter((enrollment) => !removed.has(String(enrollment.course_id))));
      if (selected && removed.has(String(selected.course_id))) {
        lessonRequest.current += 1;
        form.setFieldsValue({ enrollment_id: undefined, lesson_id: undefined });
        setLessons([]);
        setAccessNotice('所选课程已不可访问，已清除课程与课时关联。反思文字仍保留，请选择可进入的课程后再提交。');
      }
    };
    window.addEventListener(STUDENT_COURSES_CHANGED, updateCourses);
    return () => window.removeEventListener(STUDENT_COURSES_CHANGED, updateCourses);
  }, [enrollments, form]);

  const handleCourseChange = async (enrollmentId) => {
    const sequence = ++lessonRequest.current;
    const enrollment = enrollments.find((e) => e.enrollment_id === enrollmentId);
    form.setFieldValue('lesson_id', undefined);
    setLessons([]);
    setAccessNotice('');
    if (!enrollment) { setLessons([]); return; }
    try {
      const res = await courseAPI.detail(enrollment.course_id);
      if (sequence === lessonRequest.current) setLessons(res.lessons || []);
    } catch {
      if (sequence === lessonRequest.current) setLessons([]);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await archiveAPI.submitReflection(values);
      message.success('反思日志提交成功');
      form.resetFields();
      navigate('/dashboard');
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>✏️ 反思日志</Title>
      </Space>
      <Card>
        {accessNotice && <Alert type="warning" showIcon title={accessNotice} style={{ marginBottom: 16 }} />}
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          记录今天的学习收获、遇到的困难和下一步计划。每天可提交一次。选择课程与课时后，反思将关联到对应成长档案。
        </Text>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="enrollment_id" label="本次课程" rules={[{ required: true, message: '请选择课程' }]}>
            <Select
              placeholder="选择课程"
              onChange={handleCourseChange}
              options={enrollments.map((e) => ({ value: e.enrollment_id, label: e.course_title }))}
            />
          </Form.Item>
          <Form.Item name="lesson_id" label="本次课时">
            <Select allowClear placeholder="选择课时（可选）"
              options={lessons.map((l) => ({ value: l.id, label: l.title }))} />
          </Form.Item>
          <Form.Item name="difficulty" label="遇到的困难" rules={[{ required: true, message: '请填写遇到的困难' }]}>
            <Input.TextArea rows={3} placeholder="今天学习中最难理解或完成的部分" />
          </Form.Item>
          <Form.Item name="solution" label="解决方式">
            <Input.TextArea rows={3} placeholder="你是如何思考、查资料或向他人求助解决的" />
          </Form.Item>
          <Form.Item name="improvement" label="改进收获">
            <Input.TextArea rows={3} placeholder="今天有哪些收获，以及明天可以改进的地方" />
          </Form.Item>
          <Form.Item name="new_question" label="新问题">
            <Input.TextArea rows={3} placeholder="还想继续探究的问题" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交反思日志</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
