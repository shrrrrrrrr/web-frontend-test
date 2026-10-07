import { uiCopy } from './uiCopy.jsx';
import {visibleText} from './visibleText';
export {visibleText};
export function copyText(id) { return visibleText(uiCopy[id]); }
export function copyFragment(id) { return visibleText(uiCopy[id],{fragment:true}); }
