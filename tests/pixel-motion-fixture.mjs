import{prepareMentorFixture,Database,root,serveFixture}from './mentor-fixture.mjs';
export{root,serveFixture};
export function prepareMotionFixture(api=3564,front=4594){
 const f=prepareMentorFixture(api,front),db=new Database(f.env.DB_PATH);
 db.prepare("UPDATE courses SET title='星海远航 · 动效合成验收' WHERE id=9001").run();
 db.prepare('INSERT INTO course_school_scopes(course_id,school_id,created_by) VALUES(9001,7001,10001)').run();
 db.prepare('INSERT INTO enrollments(student_id,course_id,enrolled_by) VALUES(10004,9001,10001)').run();
 for(const[table,columns]of[['lesson_progress','lesson_id,progress'],['lesson_learning_reports','lesson_id,status,summary']])db.prepare(`INSERT INTO ${table}(student_id,${columns}) SELECT 10004,${columns} FROM ${table} WHERE student_id=4`).run();
 const enrollment=db.prepare('SELECT id FROM enrollments WHERE student_id=10004 AND course_id=9001').get().id;
 db.prepare("INSERT INTO works(id,student_id,enrollment_id,task_id,title,description,review_status,reject_reason) VALUES(10091,10004,?,9002,'动效验收作品（合成）','仅用于页面与权限回归','rejected','合成退回：补充记录')").run(enrollment);
 for(const[index,theme]of['campus','sky','forest','beach'].entries()){
  const id=92011+index;
  db.prepare("INSERT INTO courses(id,title,grade_level,difficulty,status,created_by,automatic_map,public_theme,learning_objectives) VALUES(?,?,'junior','basic','published',10002,1,?,'仅供动效隔离验收，不是正式教材')").run(id,theme+' · 动效合成课程',theme);
  db.prepare('INSERT INTO course_school_scopes(course_id,school_id,created_by) VALUES(?,7001,10001)').run(id);db.prepare('INSERT INTO enrollments(student_id,course_id,enrolled_by) VALUES(10004,?,10001)').run(id);
  for(let n=1;n<=3;n++){
   const lesson=id*10+n;
   db.prepare("INSERT INTO lessons(id,course_id,title,sort_order,duration,content_state,presentation_type,map_art_preset,review_content) VALUES(?,?,?,?,45,'ready','learning',?,'合成回顾：记录观察条件，不是正式教材')").run(lesson,id,['观察与发现','制作与探究','分享与成果'][n-1]+'（合成）',n,theme+'-node'+n);
   db.prepare("INSERT INTO knowledge_cards(lesson_id,title,content,status,sort_order,created_by) VALUES(?,'合成知识卡片','仅作真实读取与动效验收','published',1,10002)").run(lesson);
   db.prepare("INSERT INTO course_plan_nodes(course_id,lesson_id,position,state) VALUES(?,?,?,'linked')").run(id,lesson,n);
  }
 }
 db.prepare("INSERT INTO feedbacks(id,user_id,type,title,description,course_id,school_id,reception_level) VALUES(10091,10004,'suggestion','动效页面反馈（合成）','仅用于已有会话的页面覆盖',9001,7001,'mentor')").run();
 db.prepare("INSERT INTO notifications(id,event_key,title,content,category,created_by,action_url) VALUES(10091,'motion.fixture','合成验收通知','仅用于页面覆盖','system',10001,'/courses/9001')").run();
 for(const uid of[10001,10002,10004])db.prepare('INSERT INTO user_notifications(notification_id,user_id) VALUES(10091,?)').run(uid);
 db.close();return f;
}
