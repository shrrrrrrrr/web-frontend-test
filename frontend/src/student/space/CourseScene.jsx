import {useCoursePresentation} from './CoursePresentation';
import PublicThemeArt from './PublicThemeArt';
import SceneArt from './SceneArt';
import CourseThemeImage from './CourseThemeImage';
import {SceneMotion} from '../../motion/Motion';
export default function CourseScene(props){
 const look=useCoursePresentation(),images=look.data?.themeImages||{},opacity=look.data?.course?.background_opacity??1;
 return <div className={'course-scene-layer '+(props.className||'')} style={{opacity}} aria-hidden="true">{['sky','forest','beach'].includes(look.theme)?<PublicThemeArt theme={look.theme} className="course-scene-preset" priority={props.priority} motion={false}/>:<SceneArt {...props} className="course-scene-preset" motion={false}/>}<SceneMotion theme={look.theme} custom={!!(images.desktop||images.mobile)}/><div className="course-scene-desktop"><CourseThemeImage image={images.desktop}/></div><div className="course-scene-mobile"><CourseThemeImage image={images.mobile||images.desktop}/></div></div>;
}
