//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : ImageProcessor
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function ImageProcessor(oImageData){
   this.ImageData = oImageData;
   this.stack = [];
}

ImageProcessor.prototype.getColorStr = function(color){
   return "(r:" + color.r + "," +
          "g:" + color.g + "," +
          "b:" + color.b + "," +
          "a:" + color.a + ")";
};
ImageProcessor.prototype.getColor = function(x,y){
   var len = (y * this.ImageData.width + x) * 4;
   
   var color =  {r:this.ImageData.data[len],
                 g:this.ImageData.data[len+1],
                 b:this.ImageData.data[len+2],
                 a:this.ImageData.data[len+3]};
   
   return color;
                 
};

ImageProcessor.prototype.getColor3 = function(x,y){
   var len = (y * this.ImageData.width + x) * 4;
   
   var color1 =  {r:this.ImageData.data[len],
                  g:this.ImageData.data[len+1],
                  b:this.ImageData.data[len+2],
                  a:this.ImageData.data[len+3]};

   var colorP =  {r:this.ImageData.data[len-4],
                  g:this.ImageData.data[len-3],
                  b:this.ImageData.data[len-2],
                  a:this.ImageData.data[len-1]};
                  
   var colorN =  {r:this.ImageData.data[len+4],
                  g:this.ImageData.data[len+5],
                  b:this.ImageData.data[len+6],
                  a:this.ImageData.data[len+7]};
   
   return [colorP,color1,colorN,len];
                 
};
ImageProcessor.prototype.setColor3 = function(index,color){
  
   this.ImageData.data[index]   = color.r;
   this.ImageData.data[index+1] = color.g;
   this.ImageData.data[index+2] = color.b;
   this.ImageData.data[index+3] = color.a;
};

ImageProcessor.prototype.setColor = function(x,y,color){
  
   var len = (y * this.ImageData.width + x) * 4;
   
   this.ImageData.data[len]   = color.r;
   this.ImageData.data[len+1] = color.g;
   this.ImageData.data[len+2] = color.b;
   this.ImageData.data[len+3] = color.a;
};

ImageProcessor.prototype.equal = function(color1,color2){
   return (color1.r === color2.r &&
           color1.g === color2.g &&
           color1.b === color2.b &&
           color1.a === color2.a); 
};

ImageProcessor.prototype.floodFill4 = function(x,y,newColor,oldColor){
   
   if ( x >= 0 && x < this.ImageData.width &&
        y >= 0 && y < this.ImageData.height &&
        this.equal(this.getColor(x,y),oldColor) &&
        !this.equal(this.getColor(x,y),newColor) ){
       
       this.setColor(x,y,newColor);
       this.floodFill4(x+1 , y   , newColor,oldColor);
       this.floodFill4(x-1 , y   , newColor,oldColor);
       this.floodFill4(x   , y+1 , newColor,oldColor);
       this.floodFill4(x   , y-1 , newColor,oldColor);  
   }     
};

ImageProcessor.prototype.floodFill4Stack = function(x,y,newColor,oldColor){
   if ( this.equal(newColor,oldColor) ){
      return;
   }
   this.stack = [];
   this.stack.push([x,y]);
   
   while(true){
      var a = this.stack.pop();
      if ( !a ){break;}
      x = a[0]; y = a[1];
      this.setColor(x,y,newColor);
      
      if ( x + 1 < this.ImageData.width && this.equal(this.getColor(x+1,y),oldColor) ){
         this.stack.push([x+1,y]);
      }

      if ( x - 1 >= 0 && this.equal(this.getColor(x-1,y),oldColor) ){
         this.stack.push([x-1,y]);
      }

      if ( y + 1 < this.ImageData.height && this.equal(this.getColor(x,y+1),oldColor) ){
         this.stack.push([x,y+1]);
      }

      if ( y - 1 >= 0 && this.equal(this.getColor(x,y-1),oldColor) ){
         this.stack.push([x,y-1]);
      }
   }
};

ImageProcessor.prototype.floodFillScanlineStack = function(x,y,newColor,oldColor){
   if ( this.equal(newColor,oldColor) ){
      return;
   }
   this.stack = [];
   
   var y1,spanLeft=false,spanRight=false;
   this.stack.push([x,y]);
   
   while(true){
      var a = this.stack.pop();
      if ( !a ){break;}
      x = a[0]; y = a[1];
      
      y1 = y;
      while ( y1 >= 0 && this.equal(this.getColor(x,y1),oldColor) ){
         y1 --;
      }
      
      y1 ++;
      spanLeft = false; spanRight = false;
      
      while ( y1 < this.ImageData.height && this.equal(this.getColor(x,y1),oldColor) ){
         this.setColor(x,y1,newColor);
         
         if ( !spanLeft && x > 0 && this.equal(this.getColor(x-1,y1),oldColor) ){
            this.stack.push([x-1,y1]);
            spanLeft = true;
         }else if ( spanLeft && x > 0 && !this.equal(this.getColor(x-1,y1),oldColor) ){
            spanLeft = false;
         }
         
         
         if ( !spanRight && x < (this.ImageData.width - 1) && this.equal(this.getColor(x+1,y1),oldColor) ){
            this.stack.push([x+1,y1]);
            spanRight = true;
         }else if ( spanRight && x < (this.ImageData.width-1) && !this.equal(this.getColor(x+1,y1),oldColor) ){
            spanRight = false;
         }
         y1 ++;
      }
   }
};

ImageProcessor.prototype.floodFillScanlineStackOp1 = function(x,y,newColor,oldColor){
   if ( this.equal(newColor,oldColor) ){
      return;
   }
   this.stack = [];
   
   var y1,spanLeft=false,spanRight=false;
   this.stack.push([x,y]);
   
   while(true){
      var a = this.stack.pop();
      if ( !a ){break;}
      x = a[0]; y = a[1];
      
      y1 = y;
      while ( y1 >= 0 && this.equal(this.getColor(x,y1),oldColor) ){
         y1 --;
      }
      
      y1 ++;
      spanLeft = false; spanRight = false;
      
      while ( true ){
         var color3 = this.getColor3(x,y1);
         
         if ( ! (y1 < this.ImageData.height && this.equal(color3[1],oldColor)) ){
            break;
         }
         
         this.setColor3(color3[3],newColor);
         
         if ( !spanLeft && x > 0 && this.equal(color3[0],oldColor) ){
            this.stack.push([x-1,y1]);
            spanLeft = true;
         }else if ( spanLeft && x > 0 && !this.equal(color3[0],oldColor) ){
            spanLeft = false;
         }
         
         
         if ( !spanRight && x < (this.ImageData.width - 1) && this.equal(color3[2],oldColor) ){
            this.stack.push([x+1,y1]);
            spanRight = true;
         }else if ( spanRight && x < (this.ImageData.width-1) && !this.equal(color3[2],oldColor) ){
            spanRight = false;
         }
         y1 ++;
      }
   }
};

ImageProcessor.prototype.imageData = function(){
   if ( arguments.length === 0 ){
      return this.ImageData;
   }else{
      this.ImageData = arguments[0];
   }
};

ImageProcessor.prototype.cut = function(x,y,w,h){
   var len = (y * this.ImageData.width + x) * 4;
   w = Math.min(w,this.ImageData.width);
   h = Math.min(h,this.ImageData.height);
 
   var data = [],i,j;
   for ( i = 0; i < h; i ++ ){
      for ( j = 0; j < w; j ++ ){
         data.push(this.ImageData.data[len++]); this.ImageData.data[len-1] = 0;
         data.push(this.ImageData.data[len++]); this.ImageData.data[len-1] = 0;
         data.push(this.ImageData.data[len++]); this.ImageData.data[len-1] = 0;
         data.push(this.ImageData.data[len++]); this.ImageData.data[len-1] = 0;
      }
   }  
   
   return {width:w,height:h,data:data};
};

ImageProcessor.prototype.rotate = function(degree){
   var cx = this.ImageData.width / 2,
       cy = this.ImageData.height / 2;
   
   var arr = [
      this._rotate(0,0,cx,cy,degree),
      this._rotate(this.ImageData.width,0,cx,cy,degree),
      this._rotate(this.ImageData.width,this.ImageData.height,cx,cy,degree),
      this._rotate(0,this.ImageData.height,cx,cy,degree)
   ];
   
   var minX = Math.min(Math.min(arr[0].x,arr[1].x),Math.min(arr[2].x,arr[3].x));
   var minY = Math.min(Math.min(arr[0].y,arr[1].y),Math.min(arr[2].y,arr[3].y));
   var maxX = Math.max(Math.max(arr[0].x,arr[1].x),Math.max(arr[2].x,arr[3].x));
   var maxY = Math.max(Math.max(arr[0].y,arr[1].y),Math.max(arr[2].y,arr[3].y));
   
   var newW = maxX - minX, newH = maxY - minY;
   var new_cx = newW / 2, new_cy = newH / 2;
   
   // store selected image data to a new created canvas
   var canvas0 = document.createElement("canvas");
   canvas0.width  = this.ImageData.width;
   canvas0.height = this.ImageData.height;
   canvas0.getContext("2d").putImageData(this.ImageData,0,0);
   
   canvas1 = document.createElement("canvas");
   canvas1.width  = newW;
   canvas1.height = newH;
   
   var context1 = canvas1.getContext("2d");

   context1.save();
   context1.translate(new_cx ,new_cy);
   context1.rotate(degree * Math.PI / 180.0);
   context1.drawImage(canvas0,-cx,-cy);

   context1.restore();

   return context1.getImageData(0,0,newW, newH);
};

ImageProcessor.prototype._rotate = function(x, y, cx, cy, angle){
   angle = angle * Math.PI / 180.0;
   var dx = x - cx, dy = y - cy;
   
   var a = Math.atan2(dy,dx);
   var dist = Math.sqrt(dx*dx + dy*dy);
   
   var a2 = a + angle;
   var dx2 = Math.cos(a2) * dist,
       dy2 = Math.sin(a2) * dist;
   x = Math.round(cx + dx2); y = Math.round(cy + dy2);
   
   return {x:x,y:y};
};
