//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : Rectangle
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function Rectangle(){
   this.x      = 0;
   this.y      = 0;
   this.width  = 0;
   this.height = 0;
   this.type   = "rectangle";
   
   var argLen = arguments.length;
   switch(argLen){
   case 1: this._create1(arguments[0]);break;
   case 2: this._create2(arguments[0],arguments[1]);break;
   case 4: this._create4(arguments[0],arguments[1],arguments[2],arguments[3]);break;
   }
   
   this.getX      = function(){ return this.x;};
   this.getY      = function(){ return this.y;};
   this.getWidth  = function(){ return this.width;};
   this.getHeight = function(){ return this.height;};
}
Rectangle.prototype.toString = function(){
   return "Rectangle(" + this.x + "," + this.y + "," + this.width + "," + this.height + ")";
};
Rectangle.prototype.reset = function(){
   return this._create4(0,0,0,0);
};

Rectangle.prototype._create1 = function(r){
   return this._create4(r.x,r.y,r.width,r.height);
};
Rectangle.prototype._create4 = function(x,y,width,height){
   this.x     = x;
   this.y     = y;
   this.width = width;
   this.height = height;
   return this;
};
Rectangle.prototype._create2 = function(width,height){
   return this._create4(0,0,width,height);
};

Rectangle.prototype.getBounds = function() {
   return new Rectangle(this.x, this.y, this.width, this.height);
};
  
Rectangle.prototype.setBounds = function(x, y, width, height) {
   if ( arguments.length === 1 ){
      return this.reshape(arguments[0].x, arguments[0].y, arguments[0].width, arguments[0].height);
   }else{
      return this.reshape(x, y, width, height);
   }
};
Rectangle.prototype.setShape =
Rectangle.prototype.setRect = function(){
   var x, y, width, height,argLen = arguments.length;
   if ( argLen === 2 ){
      var ps = arguments[0], pe = arguments[1];
      x = Math.min(ps.x,pe.x);
      y = Math.min(ps.y,pe.y);
      width = Math.abs(ps.x-pe.x);
      height = Math.abs(ps.y-pe.y);
   }else{
      x = arguments[0]; y = arguments[1];
      width = arguments[2]; height = arguments[3];
   }
   
   var newx, newy, neww, newh;

   if (x > Number.MAX_VALUE) {
       // Too far in positive X direction to represent...
       // We cannot even reach the left side of the specified
       // rectangle even with both x & width set to MAX_VALUE.
       // The intersection with the "maximal integer rectangle"
       // is non-existant so we should use a width < 0.
       // REMIND: Should we try to determine a more "meaningful"
       // adjusted value for neww than just "-1"?
       newx = Number.MAX_VALUE;
       neww = -1;
   } else {
       newx = this.clip(x, false);
       if (width >= 0){width += x-newx;}
       neww = this.clip(width, width >= 0);
   }

   if (y > Number.MAX_VALUE) {
       // Too far in positive Y direction to represent...
       newy = Number.MAX_VALUE;
       newh = -1;
   } else {
       newy = this.clip(y, false);
       if (height >= 0){height += y-newy;}
       newh = this.clip(height, height >= 0);
   }

   this.reshape(newx, newy, neww, newh);
   return this;
};

Rectangle.prototype.clip = function(v, doceil) {
   if (v <= Number.MIN_VALUE) {
       return Number.MIN_VALUE;
   }
   if (v >= Number.MAX_VALUE) {
       return Number.MAX_VALUE;
   }
   return (doceil ? Math.ceil(v) : Math.floor(v));
};

Rectangle.prototype.reshape = function(x, y, width, height) {
   return this._create4(x,y,width,height);
};

Rectangle.prototype.getLocation = function() {
   return new Point(this.x, this.y);
};
Rectangle.prototype.setLocation = function(point) {
   if ( arguments.length === 2 ){
      this.x = arguments[0];
      this.y = arguments[1];
   }else{
      this.x = point.x;
      this.y = point.y;
   }
   return this;
};
Rectangle.prototype.move = function(x,y){
   this.x = x; this.y = y;
   return this;
};
Rectangle.prototype.translate = function(dx, dy) {
   var oldv = this.x;
   var newv = oldv + dx;
   if (dx < 0) {
       // moving leftward
       if (newv > oldv) {
           // negative overflow
           // Only adjust width if it was valid (>= 0).
           if (this.width >= 0) {
               // The right edge is now conceptually at
               // newv+width, but we may move newv to prevent
               // overflow.  But we want the right edge to
               // remain at its new location in spite of the
               // clipping.  Think of the following adjustment
               // conceptually the same as:
               // width += newv; newv = MIN_VALUE; width -= newv;
               this.width += newv - Number.MIN_VALUE;
               // width may go negative if the right edge went past
               // MIN_VALUE, but it cannot overflow since it cannot
               // have moved more than MIN_VALUE and any non-negative
               // number + MIN_VALUE does not overflow.
           }
           newv = Number.MIN_VALUE;
       }
   } else {
       // moving rightward (or staying still)
       if (newv < oldv) {
           // positive overflow
           if (this.width >= 0) {
               // Conceptually the same as:
               // width += newv; newv = MAX_VALUE; width -= newv;
               this.width += newv - Number.MAX_VALUE;
               // With large widths and large displacements
               // we may overflow so we need to check it.
               if (this.width < 0){this.width = Number.MAX_VALUE;}
           }
           newv = Number.MAX_VALUE;
       }
   }
   this.x = newv;

   oldv = this.y;
   newv = oldv + dy;
   if (dy < 0) {
       // moving upward
       if (newv > oldv) {
           // negative overflow
           if (this.height >= 0) {
               this.height += newv - Number.MIN_VALUE;
               // See above comment about no overflow in this case
           }
           newv = Number.MIN_VALUE;
       }
   } else {
       // moving downward (or staying still)
       if (newv < oldv) {
           // positive overflow
           if (this.height >= 0) {
               this.height += newv - Number.MAX_VALUE;
               if (this.height < 0){this.height = Number.MAX_VALUE;}
           }
           newv = Number.MAX_VALUE;
       }
   }
   this.y = newv;
};

Rectangle.prototype.resize = function(width, height) {
   this.width  = width;
   this.height = height;
   return this;
};

Rectangle.prototype.contains = function(X, Y, W, H) {
   if ( arguments.length === 2 ){
      return this.inside(X,Y);
   }
   if ( arguments.length === 1 ){
      var r = arguments[0];
      X = r.x; Y = r.y; W = r.width; H = r.height;
   }
   
   var w = this.width;
   var h = this.height;
   if ((w | h | W | H) < 0) {
       // At least one of the dimensions is negative...
       return false;
   }
   // Note: if any dimension is zero, tests below must return false...
   var x = this.x;
   var y = this.y;
   if (X < x || Y < y) {
       return false;
   }
   w += x;
   W += X;
   if (W <= X) {
       // X+W overflowed or W was zero, return false if...
       // either original w or W was zero or
       // x+w did not overflow or
       // the overflowed x+w is smaller than the overflowed X+W
       if (w >= x || W > w){return false;}
   } else {
       // X+W did not overflow and W was not zero, return false if...
       // original w was zero or
       // x+w did not overflow and x+w is smaller than X+W
       if (w >= x && W > w){return false;}
   }
   h += y;
   H += Y;
   if (H <= Y) {
       if (h >= y || H > h){return false;}
   } else {
       if (h >= y && H > h){return false;}
   }
   return true;
};

Rectangle.prototype.inside = function(X, Y) {
   var w = this.width;
   var h = this.height;
   if ((w | h) < 0) {
       // At least one of the dimensions is negative...
       return false;
   }
   // Note: if either dimension is zero, tests below must return false...
   var x = this.x;
   var y = this.y;
   if (X < x || Y < y) {
       return false;
   }
   w += x;
   h += y;
   //    overflow || intersect
   return ((w < x || w > X) &&
           (h < y || h > Y));
};

Rectangle.prototype.intersects = function(/*Rectangle*/r) {
   var tw = this.width;
   var th = this.height;
   var rw = r.width;
   var rh = r.height;
   if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
       return false;
   }
   var tx = this.x;
   var ty = this.y;
   var rx = r.x;
   var ry = r.y;
   rw += rx;
   rh += ry;
   tw += tx;
   th += ty;
   //      overflow || intersect
   return ((rw < rx || rw > tx) &&
           (rh < ry || rh > ty) &&
           (tw < tx || tw > rx) &&
           (th < ty || th > ry));
};

Rectangle.prototype.intersection = function(/*Rectangle*/r) {
   var tx1 = this.x;
   var ty1 = this.y;
   var rx1 = r.x;
   var ry1 = r.y;
   var tx2 = tx1; tx2 += this.width;
   var ty2 = ty1; ty2 += this.height;
   var rx2 = rx1; rx2 += r.width;
   var ry2 = ry1; ry2 += r.height;
   if (tx1 < rx1){ tx1 = rx1; }
   if (ty1 < ry1){ ty1 = ry1; }
   if (tx2 > rx2){ tx2 = rx2; }
   if (ty2 > ry2){ ty2 = ry2; }
   tx2 -= tx1;
   ty2 -= ty1;
   // tx2,ty2 will never overflow (they will never be
   // larger than the smallest of the two source w,h)
   // they might underflow, though...
   if (tx2 < Number.MIN_VALUE){tx2 = Number.MIN_VALUE;}
   if (ty2 < Number.MIN_VALUE){ty2 = Number.MIN_VALUE;}
   return new Rectangle(tx1, ty1, tx2, ty2);
};
Rectangle.prototype.union = function(/*Rectangle*/r) {
   var tx2 = this.width;
   var ty2 = this.height;
   if ((tx2 | ty2) < 0) {
       // This rectangle has negative dimensions...
       // If r has non-negative dimensions then it is the answer.
       // If r is non-existant (has a negative dimension), then both
       // are non-existant and we can return any non-existant rectangle
       // as an answer.  Thus, returning r meets that criterion.
       // Either way, r is our answer.
       return new Rectangle(r);
   }
   var rx2 = r.width;
   var ry2 = r.height;
   if ((rx2 | ry2) < 0) {
       return new Rectangle(this);
   }
   var tx1 = this.x;
   var ty1 = this.y;
   tx2 += tx1;
   ty2 += ty1;
   var rx1 = r.x;
   var ry1 = r.y;
   rx2 += rx1;
   ry2 += ry1;
   if (tx1 > rx1){ tx1 = rx1; }
   if (ty1 > ry1){ ty1 = ry1; }
   if (tx2 < rx2){ tx2 = rx2; }
   if (ty2 < ry2){ ty2 = ry2; }
   tx2 -= tx1;
   ty2 -= ty1;
   // tx2,ty2 will never underflow since both original rectangles
   // were already proven to be non-empty
   // they might overflow, though...
   if (tx2 > Number.MAX_VALUE){ tx2 = Number.MAX_VALUE;}
   if (ty2 > Number.MAX_VALUE){ ty2 = Number.MAX_VALUE;}
   return new Rectangle(tx1, ty1, tx2, ty2);
};

Rectangle.prototype.add = function(newx, newy) {
   if ( arguments.length === 1 ){
      return this.add_rect(arguments[0]);
   }
   if ((this.width | this.height) < 0) {
       this.x = newx;
       this.y = newy;
       this.width = this.height = 0;
       return this;
   }
   var x1 = this.x;
   var y1 = this.y;
   var x2 = this.width;
   var y2 = this.height;
   x2 += x1;
   y2 += y1;
   if (x1 > newx){ x1 = newx;}
   if (y1 > newy){ y1 = newy;}
   if (x2 < newx){ x2 = newx;}
   if (y2 < newy){ y2 = newy;}
   x2 -= x1;
   y2 -= y1;
   if (x2 > Number.MAX_VALUE){ x2 = Number.MAX_VALUE;}
   if (y2 > Number.MAX_VALUE){ y2 = Number.MAX_VALUE;}
   return this.reshape(x1, y1, x2, y2);
};
Rectangle.prototype.add_rect = function(/*Rectangle*/r) {
   var tx2 = this.width;
   var ty2 = this.height;
   if ((tx2 | ty2) < 0) {
       this.reshape(r.x, r.y, r.width, r.height);
   }
   var rx2 = r.width;
   var ry2 = r.height;
   if ((rx2 | ry2) < 0) {
       return this;
   }
   var tx1 = this.x;
   var ty1 = this.y;
   tx2 += tx1;
   ty2 += ty1;
   var rx1 = r.x;
   var ry1 = r.y;
   rx2 += rx1;
   ry2 += ry1;
   if (tx1 > rx1){ tx1 = rx1;}
   if (ty1 > ry1){ ty1 = ry1;}
   if (tx2 < rx2){ tx2 = rx2;}
   if (ty2 < ry2){ ty2 = ry2;}
   tx2 -= tx1;
   ty2 -= ty1;
   // tx2,ty2 will never underflow since both original
   // rectangles were non-empty
   // they might overflow, though...
   if (tx2 > Number.MAX_VALUE){ tx2 = Number.MAX_VALUE;}
   if (ty2 > Number.MAX_VALUE){ ty2 = Number.MAX_VALUE;}
   return this.reshape(tx1, ty1, tx2, ty2);
};

Rectangle.prototype.grow = function(h, v) {
   var x0 = this.x;
   var y0 = this.y;
   var x1 = this.width;
   var y1 = this.height;
   x1 += x0;
   y1 += y0;

   x0 -= h;
   y0 -= v;
   x1 += h;
   y1 += v;

   if (x1 < x0) {
       // Non-existant in X direction
       // Final width must remain negative so subtract x0 before
       // it is clipped so that we avoid the risk that the clipping
       // of x0 will reverse the ordering of x0 and x1.
       x1 -= x0;
       if (x1 < Number.MIN_VALUE){ x1 = Number.MIN_VALUE;}
       if (x0 < Number.MIN_VALUE){ x0 = Number.MIN_VALUE;}
       else if (x0 > Number.MAX_VALUE){ x0 = Number.MAX_VALUE;}
   } else { // (x1 >= x0)
       // Clip x0 before we subtract it from x1 in case the clipping
       // affects the representable area of the rectangle.
       if (x0 < Number.MIN_VALUE){ x0 = Number.MIN_VALUE;}
       else if (x0 > Number.MAX_VALUE){ x0 = Number.MAX_VALUE;}
       x1 -= x0;
       // The only way x1 can be negative now is if we clipped
       // x0 against MIN and x1 is less than MIN - in which case
       // we want to leave the width negative since the result
       // did not intersect the representable area.
       if (x1 < Number.MIN_VALUE){ x1 = Number.MIN_VALUE;}
       else if (x1 > Number.MAX_VALUE){ x1 = Number.MAX_VALUE;}
   }

   if (y1 < y0) {
       // Non-existant in Y direction
       y1 -= y0;
       if (y1 < Number.MIN_VALUE){ y1 = Number.MIN_VALUE;}
       if (y0 < Number.MIN_VALUE){ y0 = Number.MIN_VALUE;}
       else if (y0 > Number.MAX_VALUE){ y0 = Number.MAX_VALUE;}
   } else { // (y1 >= y0)
       if (y0 < Number.MIN_VALUE){ y0 = Number.MIN_VALUE;}
       else if (y0 > Number.MAX_VALUE){ y0 = Number.MAX_VALUE;}
       y1 -= y0;
       if (y1 < Number.MIN_VALUE){ y1 = Number.MIN_VALUE;}
       else if (y1 > Number.MAX_VALUE){ y1 = Number.MAX_VALUE;}
   }
   return this.reshape(x0, y0, x1, y1);
};
Rectangle.prototype.isEmpty = function(){
   return (this.width <= Number.MIN_VALUE) || (this.height <= Number.MIN_VALUE);
};

Rectangle.prototype.clone = function() {
   return new Rectangle()._create4(this.x,this.y,this.width,this.height);
};

Rectangle.prototype.equalTo = function(r) {
   if ( r instanceof Rectangle ){
      return (this.x === r.x && 
              this.y === r.y &&
              this.width === r.width &&
              this.height === r.height);
   }
   return false;              
};


Rectangle.prototype.drawAsSelection = function(canvasDoc,context,lineWidth,pattern){
   var x1 = canvasDoc.fixX(this.x), y1 = canvasDoc.fixY(this.y);
   var x2 = canvasDoc.fixX(this.x + this.width), y2 = canvasDoc.fixY(this.y + this.height);
   
   context.save();
   if ( lineWidth ) {
      context.lineWidth = lineWidth;
   }
   if ( !pattern ){
      pattern = [4,4];
   }
   // draw rectangle using white color
   context.beginPath();
   context.strokeStyle = "rgb(255,255,255)";
   context.strokeRect(x1,y1,this.width,this.height);
   
   context.beginPath();
   context.strokeStyle = "rgb(0,0,0)";
   PP_GLOBAL.DASHLINE(context,x1,y1,x2,y1,pattern);
   PP_GLOBAL.DASHLINE(context,x2,y1,x2,y2,pattern);
   PP_GLOBAL.DASHLINE(context,x2,y2,x1,y2,pattern);
   PP_GLOBAL.DASHLINE(context,x1,y2,x1,y1,pattern);

   context.stroke();
   context.restore();
   
   return this;
};

Rectangle.prototype.makePath = function(canvasDoc,context){
   //var x1 = canvasDoc.fixX(this.x), y1 = canvasDoc.fixY(this.y);
   var x1 = this.x, y1 = this.y;
   context.rect(x1,y1,this.width,this.height);
   return this;
};

Rectangle.prototype.getPolygon = function(){
   var poly = new Polygon();
   poly.addPoint(this.x,this.y)
       .addPoint(this.x+this.width,this.y)
       .addPoint(this.x+this.width,this.y+this.height)
       .addPoint(this.x,this.y+this.height);
   return poly;       
};

Rectangle.prototype.getCenterX = function(){
   return this.x + Math.round(this.width / 2);
};
Rectangle.prototype.getCenterY = function(){
   return this.y + Math.round(this.height / 2);
};
/**
 *       Class: Ellipse
 *
 * Description: 
 *
 */
Ellipse.prototype = new Rectangle();
Ellipse.prototype.constructor = Ellipse;

function Ellipse(){
   this.type   = "ellipse";
}

Ellipse.prototype.makePath = function(canvasDoc,context){
   var x = this.x, y = this.y;
   var w = this.width, h = this.height;
   
   var kappa = 0.5522848; // 4 * ((Math.sqrt(2)-1) / 3)
   var ox = (w / 2) * kappa;
   var oy = (h / 2) * kappa;
   var xe = x + w, ye = y + h;
   var xm = x + w / 2, ym = y + h / 2;
   
   context.beginPath();
   context.moveTo(x,ym);
   context.bezierCurveTo(x,ym-oy,xm-ox,y,xm,y);
   context.bezierCurveTo(xm + ox,y,xe,ym - oy,xe,ym);
   context.bezierCurveTo(xe,ym+oy,xm+ox,ye,xm,ye);
   context.bezierCurveTo(xm - ox,ye,x,ym + oy,x,ym);
   return this;
};

Ellipse.prototype.drawAsSelection = function(canvasDoc,context,lineWidth){
   Rectangle.prototype.drawAsSelection.call(this,canvasDoc,context,lineWidth);
   
   context.save();
   if ( lineWidth ) {
      context.lineWidth = lineWidth;
   }
   
   context.beginPath();
   this.makePath(canvasDoc,context);
   context.stroke();
   context.restore();
   
   return this;
};



/**
 *       Class: RoundedRectangle
 *
 * Description: 
 *
 */
RoundedRectangle.prototype = new Rectangle();
RoundedRectangle.prototype.constructor = RoundedRectangle;

function RoundedRectangle(){
   this.cornerRadius = 5;
   this.type   = "rounded rectangle";
}
RoundedRectangle.prototype.setCornerRadius = function(r){
   this.cornerRadius = r;
   return this;
};
RoundedRectangle.prototype.getCornerRadius = function(r){
   return this.cornerRadius;
};
RoundedRectangle.prototype.makePath = function(canvasDoc,context){
   var r = this.cornerRadius;
   var x1 = this.x,
       y1 = this.y,
       x2 = this.x + this.width,
       y2 = this.y + this.height;
       
   var radian = Math.PI / 180;
   context.beginPath();
   context.moveTo(x1,y1+r);
   context.arc(x1+r,y1+r,r,radian * 180,radian * 270,false);
   
   context.lineTo(x2-r,y1);
   context.arc(x2-r,y1+r,r,radian * 270,radian * 360,false);
   
   context.lineTo(x2,y2-r);
   context.arc(x2-r,y2-r,r,radian * 0,radian * 90,false);

   context.lineTo(x1+r,y2);
   context.arc(x1+r,y2-r,r,radian * 90,radian * 180,false);
   context.lineTo(x1,y1+r);
       
   return this;
};

RoundedRectangle.prototype.drawAsSelection = function(canvasDoc,context,lineWidth,pattern){
   var r = this.cornerRadius;
   var x1 = this.x, y1 = this.y,
       x2 = this.x + this.width, y2 = this.y + this.height;

   if ( lineWidth ) {
      context.lineWidth = lineWidth;
   }
   if ( !pattern ){
      pattern = [4,4];
   }
   // draw using white color
   context.save();
   context.beginPath();
   context.strokeStyle = "rgb(255,255,255)";

   var radian = Math.PI / 180;
   context.beginPath();
   context.moveTo(canvasDoc.fixX(x1),canvasDoc.fixY(y1+r));
   context.arc(canvasDoc.fixX(x1+r),canvasDoc.fixY(y1+r),r,radian * 180,radian * 270,false);
   
   context.lineTo(canvasDoc.fixX(x2-r),canvasDoc.fixY(y1));
   context.arc(canvasDoc.fixX(x2-r),canvasDoc.fixY(y1+r),r,radian * 270,radian * 360,false);
   
   context.lineTo(canvasDoc.fixX(x2),canvasDoc.fixY(y2-r));
   context.arc(canvasDoc.fixX(x2-r),canvasDoc.fixY(y2-r),r,radian * 0,radian * 90,false);

   context.lineTo(canvasDoc.fixX(x1+r),canvasDoc.fixY(y2));
   context.arc(canvasDoc.fixX(x1+r),canvasDoc.fixY(y2-r),r,radian * 90,radian * 180,false);
   context.lineTo(canvasDoc.fixX(x1),canvasDoc.fixY(y1+r));
   
   context.stroke();
   context.restore();
   
   // draw using dashed line
   context.save();
   context.beginPath();
   context.strokeStyle = "rgb(0,0,0)";

   
   var radian = Math.PI / 180;
   context.beginPath();
   context.moveTo(canvasDoc.fixX(x1),canvasDoc.fixY(y1+r));
   context.arc(canvasDoc.fixX(x1+r),canvasDoc.fixY(y1+r),r,radian * 180,radian * 270,false);

   PP_GLOBAL.DASHLINE(context,canvasDoc.fixX(x1+r),canvasDoc.fixY(y1),canvasDoc.fixX(x2-r),canvasDoc.fixY(y1),pattern);   
   context.arc(canvasDoc.fixX(x2-r),canvasDoc.fixY(y1+r),r,radian * 270,radian * 360,false);
   
   PP_GLOBAL.DASHLINE(context,canvasDoc.fixX(x2),canvasDoc.fixY(y1+r),canvasDoc.fixX(x2),canvasDoc.fixY(y2-r),pattern);   
   context.arc(canvasDoc.fixX(x2-r),canvasDoc.fixY(y2-r),r,radian * 0,radian * 90,false);
   
   
   PP_GLOBAL.DASHLINE(context,canvasDoc.fixX(x2-r),canvasDoc.fixY(y2),canvasDoc.fixX(x1+r),canvasDoc.fixY(y2),pattern);   
   context.arc(canvasDoc.fixX(x1+r),canvasDoc.fixY(y2-r),r,radian * 90,radian * 180,false);
   
   PP_GLOBAL.DASHLINE(context,canvasDoc.fixX(x1),canvasDoc.fixY(y2-r),canvasDoc.fixX(x1),canvasDoc.fixY(y1+r),pattern);

   context.stroke();
   context.restore();
   
   return this;
};



/**
 *       Class: Heart
 *
 * Description: 
 *
 */
Heart.prototype = new Rectangle();
Heart.prototype.constructor = Heart;

function Heart(){
   this.type  = "heart";
}

Heart.prototype.makePath = function(canvasDoc,context){
   var x = this.x, y = this.y;
   var w = this.width, h = this.height;
   
   var x0 = x + 0.5 * w, y0 = y + 0.3 * h;
   var x1 = x + 0.1 * w, y1 = y + 0.0 * h;
   var x2 = x + 0.0 * w, y2 = y + 0.6 * h;
   var x3 = x + 0.5 * w, y3 = y + 0.9 * h;
   var x4 = x + 1.0 * w, y4 = y + 0.6 * h;
   var x5 = x + 0.9 * w, y5 = y + 0.0 * h;
   
   context.beginPath();
   context.moveTo(x0,y0);
   context.bezierCurveTo(x1,y1,x2,y2,x3,y3);
   context.bezierCurveTo(x4,y4,x5,y5,x0,y0);
   
   return this;
};

Heart.prototype.drawAsSelection = function(canvasDoc,context,lineWidth){
   Rectangle.prototype.drawAsSelection.call(this,canvasDoc,context,lineWidth);
   
   context.save();
   if ( lineWidth ) {
      context.lineWidth = lineWidth;
   }
   
   context.beginPath();

   var x = this.x, y = this.y;
   var w = this.width, h = this.height;
   
   var x0 = x + 0.5 * w, y0 = y + 0.3 * h;
   var x1 = x + 0.1 * w, y1 = y + 0.0 * h;
   var x2 = x + 0.0 * w, y2 = y + 0.6 * h;
   var x3 = x + 0.5 * w, y3 = y + 0.9 * h;
   var x4 = x + 1.0 * w, y4 = y + 0.6 * h;
   var x5 = x + 0.9 * w, y5 = y + 0.0 * h;
   
   context.moveTo(canvasDoc.fixX(x0),canvasDoc.fixY(y0));
   context.bezierCurveTo(canvasDoc.fixX(x1),canvasDoc.fixY(y1),canvasDoc.fixX(x2),canvasDoc.fixY(y2),canvasDoc.fixX(x3),canvasDoc.fixY(y3));
   context.bezierCurveTo(canvasDoc.fixX(x4),canvasDoc.fixY(y4),canvasDoc.fixX(x5),canvasDoc.fixY(y5),canvasDoc.fixX(x0),canvasDoc.fixY(y0));
   
   context.stroke();
   context.restore();
   
   return this;
};
