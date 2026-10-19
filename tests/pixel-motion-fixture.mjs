import{prepareMentorFixture,Database,root,serveFixture}from './mentor-fixture.mjs';
export{root,serveFixture};
export function prepareMotionFixture(api=3564,front=4594){
 const f=prepareMentorFixture(api,front),db=new Database(f.env.DB_PATH);
 db.prepare("UPDATE courses SET title='星海远航 · 动效合成验收' WHERE id=9001").run();
 for(const[id,type,art]of[[90011,'visit','vr'],[90012,'theory','theory'],[90013,'experiment','experiment']])db.prepare('UPDATE lessons SET presentation_type=?,map_art_preset=? WHERE id=?').run(type,art,id);
 db.prepare('INSERT INTO course_school_scopes(course_id,school_id,created_by) VALUES(9001,7001,10001)').run();
 db.prepare('INSERT INTO enrollments(student_id,course_id,enrolled_by) VALUES(10004,9001,10001)').run();
 for(const[table,columns]of[['lesson_progress','lesson_id,progress'],['lesson_learning_reports','lesson_id,status,summary']])db.prepare(`INSERT INTO ${table}(student_id,${columns}) SELECT 10004,${columns} FROM ${table} WHERE student_id=4`).run();
 const enrollment=db.prepare('SELECT id FROM enrollments WHERE student_id=10004 AND course_id=9001').get().id;
 // Four real learning stages must be reachable, not four URLs rendering stage 0.
 db.prepare("UPDATE lessons SET content_state='ready',presentation_type='learning',review_content='四阶段合成课堂回顾' WHERE id=90014").run();
 db.prepare('INSERT OR IGNORE INTO lesson_review_completions(student_id,lesson_id) VALUES(10004,90014)').run();
 const learningCards=db.prepare("SELECT id FROM knowledge_cards WHERE lesson_id=90014 AND status='published'").all();
 if(!learningCards.length)learningCards.push({id:Number(db.prepare("INSERT INTO knowledge_cards(lesson_id,title,content,status,created_by) VALUES(90014,'四阶段合成卡片','仅用于路由与动效验收','published',10001)").run().lastInsertRowid)});
 for(const card of learningCards){
  let exercises=db.prepare('SELECT id FROM card_exercises WHERE card_id=?').all(card.id);
  if(!exercises.length)exercises=[{id:Number(db.prepare("INSERT INTO card_exercises(card_id,question_type,prompt,answer_json,explanation,is_required) VALUES(?,'true_false','合成题','true','合成题解析：仅用于动效验收',1)").run(card.id).lastInsertRowid)}];
  for(const e of exercises)db.prepare("INSERT INTO card_exercise_attempts(student_id,exercise_id,answer_json,is_correct,score,attempt_no) VALUES(10004,?,'true',1,1,1)").run(e.id);
  db.prepare("INSERT OR REPLACE INTO student_card_progress(student_id,card_id,completed_at) VALUES(10004,?,CURRENT_TIMESTAMP)").run(card.id);
 }
 db.prepare("INSERT INTO lesson_learning_reports(student_id,lesson_id,enrollment_id,summary,status) VALUES(10004,90014,?,'四阶段合成报告','submitted')").run(enrollment);
 db.prepare("INSERT INTO works(id,student_id,enrollment_id,task_id,title,description,review_status,reject_reason) VALUES(10091,10004,?,9002,'动效验收作品（合成）','仅用于页面与权限回归','rejected','合成退回：补充记录')").run(enrollment);
 for(const[index,theme]of['campus','sky','forest','beach'].entries()){
  const id=92011+index;
  db.prepare("INSERT INTO courses(id,title,grade_level,difficulty,status,created_by,automatic_map,map_mode,public_theme,learning_objectives) VALUES(?,?,'junior','basic','published',10002,1,'plan',?,'仅供动效隔离验收，不是正式教材')").run(id,theme+' · 动效合成课程',theme);
  db.prepare('INSERT INTO course_school_scopes(course_id,school_id,created_by) VALUES(?,7001,10001)').run(id);db.prepare('INSERT INTO enrollments(student_id,course_id,enrolled_by) VALUES(10004,?,10001)').run(id);
  for(let n=1;n<=3;n++){
   const lesson=id*10+n;
   db.prepare("INSERT INTO lessons(id,course_id,title,sort_order,duration,content_state,presentation_type,map_art_preset,review_content) VALUES(?,?,?,?,45,'ready','learning',?,'合成回顾：记录观察条件，不是正式教材')").run(lesson,id,['观察与发现','制作与探究','分享与成果'][n-1]+'（合成）',n,theme+'-node'+n);
   const card=Number(db.prepare("INSERT INTO knowledge_cards(lesson_id,title,content,status,sort_order,created_by) VALUES(?,'合成知识卡片','仅作真实读取与动效验收','published',1,10002)").run(lesson).lastInsertRowid);
   db.prepare("INSERT INTO card_exercises(card_id,question_type,prompt,answer_json,explanation,is_required) VALUES(?,'true_false','合成观察题','true','先记录观察条件（合成解析）',1)").run(card);
   db.prepare("INSERT INTO course_plan_nodes(course_id,lesson_id,position,state) VALUES(?,?,?,'linked')").run(id,lesson,n);
  }
  db.prepare("INSERT INTO course_plan_nodes(course_id,position,state) VALUES(?,4,'preparing')").run(id);
 }
 db.prepare("INSERT INTO feedbacks(id,user_id,type,title,description,course_id,school_id,reception_level) VALUES(10091,10004,'suggestion','动效页面反馈（合成）','仅用于已有会话的页面覆盖',9001,7001,'mentor')").run();
 db.prepare("INSERT INTO notifications(id,event_key,title,content,category,created_by,action_url) VALUES(10091,'motion.fixture','合成验收通知','仅用于页面覆盖','system',10001,'/courses/9001')").run();
 for(const uid of[10001,10002,10004])db.prepare('INSERT INTO user_notifications(notification_id,user_id) VALUES(10091,?)').run(uid);
 db.close();return f;
}
