import {StudySection} from '../visual/StudyUI';
import Sentence from '../../content/Sentence';
import {copyText} from '../../content/copy';
// Presentational only: both maintenance previews and students use these regions.
export function VisitSections({lesson,photos,renderPhoto}){
 return <><StudySection title={copyText('next.visit.moments')}><Sentence>{lesson.moments_note}</Sentence>{photos.length?<div className="visit-photos">{photos.map(renderPhoto)}</div>:<p>{copyText('next.visit.empty')}</p>}</StudySection><StudySection title={lesson.article_title||copyText('next.visit.article')}>{lesson.article_url?<a href={lesson.article_url} target="_blank" rel="noopener noreferrer">{copyText('next.visit.original')}</a>:<p>{copyText('next.visit.noArticle')}</p>}</StudySection></>;
}
export function LessonDescription({lesson}){return lesson.description?<StudySection title={copyText('next.template.description')}><Sentence>{lesson.description}</Sentence></StudySection>:null;}
