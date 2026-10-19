// Project authored source coordinates through the same cover/contain crop as the image.
export function projectPlacement({width,height,sourceWidth,sourceHeight,fit='cover',position=[.5,.5]},item){
 if(!width||!height||!sourceWidth||!sourceHeight)return null;
 const k=fit==='fill'?null:(fit==='contain'?Math.min:Math.max)(width/sourceWidth,height/sourceHeight);
 const sx=k??width/sourceWidth,sy=k??height/sourceHeight,ox=(width-sourceWidth*sx)*position[0],oy=(height-sourceHeight*sy)*position[1];
 const scale=(item.pixelScale??1)*Math.min(sx,sy),w=48*scale,h=32*scale;
 const x=ox+item.point[0]*sourceWidth*sx-w/2,y=oy+item.point[1]*sourceHeight*sy-h/2;
 const r=item.region,region={x:ox+r[0]*sourceWidth*sx,y:oy+r[1]*sourceHeight*sy,width:r[2]*sourceWidth*sx,height:r[3]*sourceHeight*sy};
 const ink=item.ink??[0,0,48,32],visibleBounds={x:x+ink[0]*scale,y:y+ink[1]*scale,width:ink[2]*scale,height:ink[3]*scale};
 // Never relocate a cropped object onto unrelated scenery. Its source anchor stays fixed.
 if(x<0||y<0||x+w>width||y+h>height||visibleBounds.x<region.x-1||visibleBounds.y<region.y-1||visibleBounds.x+visibleBounds.width>region.x+region.width+1||visibleBounds.y+visibleBounds.height>region.y+region.height+1)return null;
 return{x,y,width:w,height:h,scale,region,visibleBounds};
}
export function imageKey(src=''){return src.split('/').at(-1)?.replace(/-\d+\.webp(?:\?.*)?$/,'')||'';}
export function imagePosition(value='50% 50%'){
 const keyword={left:0,top:0,center:.5,right:1,bottom:1},parts=value.split(/\s+/);
 return [0,1].map(i=>{const p=parts[i]??'50%';return keyword[p]??(p.endsWith('%')?parseFloat(p)/100:.5);});
}
