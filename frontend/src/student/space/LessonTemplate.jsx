import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {StudyHeader,StudySection} from '../visual/StudyUI';
import {copyText} from '../../content/copy';
import Sentence from '../../content/Sentence';
import PageContainer from '../../components/common/PageContainer';
import AssociatedExperiments from '../AssociatedExperiments';
import CourseResourceDownload from '../CourseResourceDownload';
import {useCourseApis} from '../useCourseApis';
function Photo({resource}){
 const {courseAPI}=useCourseApis(),[url,setUrl]=useState('');
 useEffect(()=>{let live=true,blobUrl;courseAPI.downloadResource(resource.id).then(blob=>{blobUrl=URL.createObjectURL(blob);if(live)setUrl(blobUrl);}).catch(()=>{});return()=>{live=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};},[resource.id,courseAPI]);
 return <figure>{url?<img src={url} alt={resource.title}/>:<p>{copyText('next.visit.photoUnavailable')}</p>}<figcaption>{resource.title}<Sentence>{resource.description}</Sentence></figcaption></figure>;
}
export default function LessonTemplate({data}){
 const {lesson,course,resources}=data,visit=lesson.presentation_type==='visit';
 const photos=resources.filter(r=>r.lesson_id===lesson.id&&['png','jpg','jpeg','webp'].includes(r.file_type));
 return <PageContainer><div className="study-workspace lesson-template" data-testid="lesson-template"><StudyHeader title={lesson.title} description={copyText(visit?'next.visit.info':'next.template.preparing')}/>
 <Link to={'/courses/'+course.id+'?lesson='+lesson.id}>{copyText('course.nav.return')}</Link>
 {visit?<><StudySection title={copyText('next.visit.moments')}><Sentence>{lesson.moments_note}</Sentence>{photos.length?<div className="visit-photos">{photos.map(r=><Photo key={r.id} resource={r}/>)}</div>:<p>{copyText('next.visit.empty')}</p>}</StudySection><StudySection title={lesson.article_title||copyText('next.visit.article')}>{lesson.article_url?<a href={lesson.article_url} target="_blank" rel="noopener noreferrer">{copyText('next.visit.original')}</a>:<p>{copyText('next.visit.noArticle')}</p>}</StudySection><p>{copyText('next.visit.noCompletion')}</p></>:<>{['review','cards','tasks'].map(key=><StudySection key={key} title={copyText('next.template.'+key)}><p>{copyText('next.template.empty')}</p></StudySection>)}<StudySection title={copyText('next.template.experiment')}><Sentence>{lesson.teaching_tip}</Sentence><AssociatedExperiments courseId={course.id} lessonId={lesson.id} stage={0}/></StudySection></>}
 {lesson.description&&<StudySection title={copyText('next.template.description')}><Sentence>{lesson.description}</Sentence></StudySection>}
 <StudySection title={copyText('system.map.014')}>{resources.length?resources.map(r=><div key={r.id}><strong>{r.title}</strong><CourseResourceDownload resource={r} courseId={course.id}/></div>):<p>{copyText('next.template.noResources')}</p>}</StudySection></div></PageContainer>;
}
