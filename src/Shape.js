//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : G_Shape
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function dashedLine (ctx, fromX, fromY, toX, toY, pattern) {
  // Our growth rate for our line can be one of the following:
  //   (+,+), (+,-), (-,+), (-,-)
  // Because of this, our algorithm needs to understand if the x-coord and
  // y-coord should be getting smaller or larger and properly cap the values
  // based on (x,y).
  var lt = function (a, b) { return (a <= b) || (Math.abs(a-b) < 1); };
  var gt = function (a, b) { return (a >= b) || (Math.abs(a-b) < 1); };
  var capmin = function (a, b) { return Math.min(a, b); };
  var capmax = function (a, b) { return Math.max(a, b); };

  var checkX = { thereYet: gt, cap: capmin };
  var checkY = { thereYet: gt, cap: capmin };

  if (fromY - toY > 0) {
    checkY.thereYet = lt;
    checkY.cap = capmax;
  }
  if (fromX - toX > 0) {
    checkX.thereYet = lt;
    checkX.cap = capmax;
  }

  ctx.moveTo(fromX, fromY);
  var offsetX = fromX;
  var offsetY = fromY;
  var idx = 0, dash = true;
  while (!(checkX.thereYet(offsetX, toX) && checkY.thereYet(offsetY, toY))) {
    var ang = Math.atan2(toY - fromY, toX - fromX);
    var len = pattern[idx];

    offsetX = checkX.cap(toX, offsetX + (Math.cos(ang) * len));
    offsetY = checkY.cap(toY, offsetY + (Math.sin(ang) * len));

    if (dash){ctx.lineTo(offsetX, offsetY);}
    else{ctx.moveTo(offsetX, offsetY);}

    idx = (idx + 1) % pattern.length;
    dash = !dash;
  }
}


function G_Point(x,y){
   this.x = x;
   this.y = y;
}

G_Point.prototype.clone = function(){
   return new G_Point(this.x,this.y);
};

G_Point.prototype.toString = function(){
   return this.x + "," + this.y;
};

function G_Shape(){
   this.type       = "shape";
   this.ObjectType = "shape";
   this.nodes      = [];
   this.minX       = this.minY = this.maxX = this.maxY = 0;
   this.closeShape = false;
}
G_Shape.prototype.clone = function(){
   var shape = new G_Shape();
   shape.type = this.type;
   var i;
   for ( i = 0; i < this.nodes.length; i ++ ){
      shape.addNode(this.nodes[i].clone());
   }
   return shape;
};

G_Shape.prototype.isClosedShape = function(){
   return this.closeShape;
};

/**
 * myContext must contain the following fields:
 * context       : canvas context for drawing
 * outline       : "none","solid"
 * fill          : "none","solid"
 * lineTreatment : 0, 0.5
 */
 
G_Shape.prototype.makePath = function(myCtx){
   myCtx.context.beginPath();
   myCtx.context.moveTo(this.nodes[0].x + myCtx.lineTreatment, this.nodes[0].y + myCtx.lineTreatment);
   var i;
   for ( i = 1; i < this.nodes.length; i ++ ){
      myCtx.context.lineTo(this.nodes[i].x + myCtx.lineTreatment, this.nodes[i].y + myCtx.lineTreatment);
   }
   return this;
};

G_Shape.prototype.draw = function(myCtx){
   return this.makePath(myCtx);
};

G_Shape.prototype.width = function(){
   return this.maxX - this.minX;
};
G_Shape.prototype.height = function(){
   return this.maxY - this.minY;
};
G_Shape.prototype.getType = function(){
   return this.type;
};
G_Shape.prototype.setType = function(sType){
   this.type = sType;
   return this;
};
G_Shape.prototype.reset = function(){
   this.nodes = [];
   this.minX = this.minY = this.maxX = this.maxY = 0;
   return this;
};

G_Shape.prototype._addOneNode = function(g_point){
   this.nodes.push(g_point);

   if ( this.nodes.length === 1 ){
      this.minX = this.maxX = g_point.x;
      this.minY = this.maxY = g_point.y;
   }else{
      this.minX = Math.min(this.minX, g_point.x);
      this.maxX = Math.max(this.maxX, g_point.x);
      this.minY = Math.min(this.minY, g_point.y);
      this.maxY = Math.max(this.maxY, g_point.y);
   }
};
G_Shape.prototype.addNode = function(){
   var lastNode;
   if ( arguments.length === 1 ){
      if ( arguments[0] instanceof G_Point ){
         lastNode = this.lastNode();
         if ( !(lastNode && lastNode.x === arguments[0].x && lastNode.y === arguments[0].y) ){
            this._addOneNode(arguments[0]);
         }
      }
   }else{
      if ( (arguments.length % 2) === 0 ){
         var i;
         for( i = 0; i < arguments.length; i += 2 ){
            var new_point = new G_Point(arguments[i],arguments[i+1]);
            
            lastNode = this.lastNode();
            if ( !(lastNode && lastNode.x === new_point.x && lastNode.y === new_point.y) ){
               this._addOneNode(new_point);
            }
         }
      }
   }
   return this;
};

G_Shape.prototype.setNode = function(iIndex,g_point){
   if ( iIndex < this.nodes.length ){
      this.nodes[iIndex].x = g_point.x;
      this.nodes[iIndex].y = g_point.y;
      var i;
      for ( i = 0; i < this.nodes.length; i ++ ){
         if ( i === 0 ){
            this.minX = this.maxX = this.nodes[i].x;
            this.minY = this.maxY = this.nodes[i].y;
         }else{
            this.minX = Math.min(this.minX, this.nodes[i].x);
            this.maxX = Math.max(this.maxX, this.nodes[i].x);
            this.minY = Math.min(this.minY, this.nodes[i].y);
            this.maxY = Math.max(this.maxY, this.nodes[i].y);
         }
      }
   }else{
      this._addOneNode(g_point);
   }
   return this;
};
G_Shape.prototype.nodesCount = function(){
   return this.nodes.length;
};

G_Shape.prototype.getNode = function(iIndex){
   if ( iIndex < this.nodes.length ){
      return this.nodes[iIndex];
   }
   return null;
};

G_Shape.prototype.firstNode = function(){
   if ( this.nodes.length > 0 ){
      return this.nodes[0];
   }
   return null;
};

G_Shape.prototype.lastNode = function(){
   if ( this.nodes.length > 0 ){
      return this.nodes[this.nodes.length-1];
   }
   return null;
};


G_Shape.prototype.move = function(dx,dy){
   if ( dx === 0 && dy === 0 ){
      return this;
   }
   var i;
   for ( i = 0; i < this.nodes.length; i ++ ){
      this.nodes[i].x += dx;
      this.nodes[i].y += dy;
   }
   this.minX += dx; this.maxX += dx;
   this.minY += dy; this.maxY += dy;
   return this;
};

G_Shape.prototype._rotateOneNode = function(g_point, cx, cy, angle,clone){
   angle = angle * Math.PI / 180.0;
   var dx = g_point.x - cx, dy = g_point.y - cy;
   
   var a = Math.atan2(dy,dx);
   var dist = Math.sqrt(dx*dx + dy*dy);
   
   var a2 = a + angle;
   var dx2 = Math.cos(a2) * dist,
       dy2 = Math.sin(a2) * dist;
   
   
   if ( clone ){
      return new G_Point(Math.round(cx + dx2),Math.round(cy + dy2));
   }else{
      g_point.x = Math.round(cx + dx2); g_point.y = Math.round(cy + dy2);
      return g_point;
   }
};

G_Shape.prototype.rotate = function(degree,clone){
   var cx = this.minX + this.width() / 2,
       cy = this.minY + this.height() / 2;
   
   var clone_shape = null;
   if ( clone ){
      clone_shape = new G_Shape();
   }    
   var i;
   for ( i = 0; i < this.nodes.length; i ++ ){
      if ( clone ){
         clone_shape.addNode(this._rotateOneNode(this.nodes[i],cx,cy,degree,clone));
      }else{
         this.nodes[i] = this._rotateOneNode(this.nodes[i],cx,cy,degree,clone);
         if ( i === 0 ){
            this.minX = this.maxX = this.nodes[i].x;
            this.minY = this.maxY = this.nodes[i].y;
         }else{
            this.minX = Math.min(this.minX, this.nodes[i].x);
            this.maxX = Math.max(this.maxX, this.nodes[i].x);
            this.minY = Math.min(this.minY, this.nodes[i].y);
            this.maxY = Math.max(this.maxY, this.nodes[i].y);
         }
      }
   }
   
   if ( clone ){
      return clone_shape;
   }
   return this;
};

G_Shape.prototype.flip_h = function(){
   var i;
   for ( i = 0; i < this.nodes.length; i ++ ){
      var node = this.nodes[i];
      node.x = this.minX + this.maxX - node.x;
      this.nodes[i] = node;
   }
   return this;
};

G_Shape.prototype.flip_v = function(){
   var i;
   for ( i = 0; i < this.nodes.length; i ++ ){
      var node = this.nodes[i];
      node.y = this.minY + this.maxY - node.y;
      this.nodes[i] = node;
   }
   return this;
};


G_Shape.prototype.scale = function(h_r,v_r){
   if ( h_r === 1 && v_r === 1 ){
      return this;
   }
   var i,dx,dy,newDx,newDy;
   for ( i = 0; i < this.nodes.length; i ++ ){
      var x = this.nodes[i].x, y = this.nodes[i].y;
      
      if ( h_r < 0 ){
         dx = this.maxX - this.nodes[i].x;
         newDx = dx * Math.abs(h_r) - dx;
         x -= newDx;
      }else{
         dx = this.nodes[i].x - this.minX;
         newDx = dx * Math.abs(h_r) - dx;
         x += newDx;
      }

      if ( v_r < 0 ){
         dy = this.maxY - this.nodes[i].y;
         newDy = dy * Math.abs(v_r) - dy;
         y -= newDy;
      }else{
         dy = this.nodes[i].y - this.minY;
         newDy = dy * Math.abs(v_r) - dy;
         y += newDy;
      }
      
      this.nodes[i].x = x;
      this.nodes[i].y = y;
      
   }
   
   for ( i = 0; i < this.nodes.length; i ++ ){
      if ( i === 0 ){
         this.minX = this.maxX = this.nodes[i].x;
         this.minY = this.maxY = this.nodes[i].y;
      }else{
         this.minX = Math.min(this.minX, this.nodes[i].x);
         this.maxX = Math.max(this.maxX, this.nodes[i].x);
         this.minY = Math.min(this.minY, this.nodes[i].y);
         this.maxY = Math.max(this.maxY, this.nodes[i].y);
      }
   }
   return this;
};

G_Shape.prototype.toString = function(delimiter){
   delimiter = delimiter || "|";
   //type:close_flag:bounding:node_list
   var s1 = this.type + delimiter +
            ((this.closeShape) ? "1" : "0");

   var s = [];
   var i;
   for ( i = 0; i < this.nodes.length; i ++ ){
      s.push(this.nodes[i].x.toFixed(2).replace(".00","") + "," + this.nodes[i].y.toFixed(2).replace(".00",""));
   }
   return s1 + delimiter + s.join(",");
};

/**
 * class : G_Line
 */

function G_Line(){this.type = "Line";this.closeShape = false;}
EXTEND(G_Line,G_Shape); 

G_Line.prototype.init = function(xs,ys,xe,ye){
   this.addNode(new G_Point(xs,ys))
       .addNode(new G_Point(xe,ye));
   
   return this;
};

G_Line.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      G_Shape.prototype.makePath.call(this,myCtx);
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};

G_Line.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1, arrNodes[1] * 1, arrNodes[2] * 1, arrNodes[3] * 1);
   return this;
};

/**
 * class : G_Curve
 */
EXTEND(G_Curve,G_Shape); 

function G_Curve(){this.type = "Bezier curve";this.closeShape = false;}

G_Curve.prototype.init = function(xs,ys,xe,ye,xc1,yc1,xc2,yc2){
   this.addNode(new G_Point(xs,ys))
       .addNode(new G_Point(xe,ye))
       .addNode(new G_Point(xc1,yc1))
       .addNode(new G_Point(xc2,yc2));
   
   return this;
};

G_Curve.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1,
                     arrNodes[4] * 1,arrNodes[5] * 1,arrNodes[6] * 1,arrNodes[7] * 1);
   return this;                   
};

/**
 * Draw bezier curve. node 0 and node1 define the base line
 * and node2, node3 is the control node.
 */
G_Curve.prototype.draw = function(myCtx){
   this.makePath(myCtx);
   if ( myCtx.outline === "solid" ){
      myCtx.context.stroke();
   }
};

G_Curve.prototype.makePath = function(myCtx){
   myCtx.context.beginPath();
   myCtx.context.moveTo(this.nodes[0].x,this.nodes[0].y);
   if ( this.nodes.length === 4 ){
      myCtx.context.bezierCurveTo(this.nodes[2].x,this.nodes[2].y,
                          this.nodes[3].x,this.nodes[3].y,
                          this.nodes[1].x,this.nodes[1].y);
   }else if ( this.nodes.length === 3 ){
      myCtx.context.bezierCurveTo(this.nodes[0].x,this.nodes[0].y,
                                  this.nodes[2].x,this.nodes[2].y,
                                  this.nodes[1].x,this.nodes[1].y);
   }else if ( this.nodes.length === 2 ){
      myCtx.context.lineTo(this.nodes[1].x,this.nodes[1].y);
   }
};


/**
 * class : G_Rectangle
 */
EXTEND(G_Rectangle,G_Shape); 
function G_Rectangle(){this.type = "Rectangle";this.closeShape = true;}

G_Rectangle.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   
   return this;
};

G_Rectangle.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1);
   return this;
};

G_Rectangle.prototype.makePath = function(myCtx){
   myCtx.context.beginPath();
   myCtx.context.moveTo(this.nodes[0].x + myCtx.lineTreatment, this.nodes[0].y + myCtx.lineTreatment);
   myCtx.context.lineTo(this.nodes[1].x + myCtx.lineTreatment, this.nodes[0].y + myCtx.lineTreatment);
   myCtx.context.lineTo(this.nodes[1].x + myCtx.lineTreatment, this.nodes[1].y + myCtx.lineTreatment);
   myCtx.context.lineTo(this.nodes[0].x + myCtx.lineTreatment, this.nodes[1].y + myCtx.lineTreatment);
   myCtx.context.lineTo(this.nodes[0].x + myCtx.lineTreatment, this.nodes[0].y + myCtx.lineTreatment);
   myCtx.context.closePath();
   return this;
};

G_Rectangle.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      myCtx.context.beginPath();
      var w = this.width(), h = this.height();
      if ( myCtx.fill === "solid" ){
         myCtx.context.fillRect(this.minX + myCtx.lineTreatment,this.minY + myCtx.lineTreatment,w,h);
      }
      if ( myCtx.outline === "solid" ){
         myCtx.context.strokeRect(this.minX + myCtx.lineTreatment,this.minY + myCtx.lineTreatment,w,h);
      }
   }
};

/**
 * class : G_TextShape
 */
EXTEND(G_TextShape,G_Shape); 
function G_TextShape(){
   this.type = "Text";
   this.Text = "";
}

G_TextShape.prototype.text = function(){
   if ( arguments.length === 0 ){
      return this.Text;
   }else{
      this.Text = arguments[0];
   }
   return this;
};

G_TextShape.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   return this;
};

G_TextShape.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      var w = this.maxX - this.minX;
      var h = this.maxY - this.minY;
      myCtx.context.save();
      myCtx.context.strokeStyle = "rgba(0,0,0,0.1)";
      myCtx.context.lineWidth = 1;
      myCtx.context.strokeRect(this.minX + 0.5,this.minY + myCtx.lineTreatment+0.5,w,h);
      myCtx.context.restore();
   }
};

G_TextShape.prototype.toString = function(){
   var s = this.parent.toString.call(this);
   
   return s + "|" + this.Text;
};


G_TextShape.fitText = function(context,str,w){
   var arrStr = str.split("\n");
   
   var nLen = arrStr.length;
   var i,j;
   for ( i = 0; i < nLen; i ++ ){
      var text = arrStr[i];
      var arr = G_TextShape._fitText(context,text,w);
      for ( j = arr.length - 1; j >= 0; j -- ){
         arrStr.splice(i+1,0,arr[j]);
      }
      arrStr.splice(i,1);
   }
   return arrStr;
};

G_TextShape._fitText = function(context,text,w){
   var t_w = context.measureText(text);
   if ( t_w.width < w ){
      return [text];
   }
   
   var i;
   for ( i = text.length - 1, n = 0; i >= 0; i --, n ++ ){
      var new_text = text.substr(0,i);
      t_w = context.measureText(new_text);
      if ( t_w.width < w ){
         var left_over = text.substr(i,n+1);
         return [new_text].concat(G_TextShape._fitText(context,left_over,w));
      }
   }
};

G_TextShape.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   var sText     = arr[3];
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1).text(sText);
   return this;
};

/**
 * class : G_Oval
 */
EXTEND(G_Oval,G_Shape); 
function G_Oval(){this.type = "Oval";this.closeShape = true;}

G_Oval.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   return this;
};

G_Oval.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1);
   return this;
};

G_Oval.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      this.makePath(myCtx);
      
      if ( myCtx.fill === "solid" ){
         myCtx.context.fill();
      }
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};

G_Oval.prototype.makePath = function(myCtx){
   var x = this.minX + myCtx.lineTreatment, 
       y = this.minY + myCtx.lineTreatment;
   var w = this.width(), h = this.height();
   
   var kappa = 0.5522848,    /*  4 * ((Math.sqrt(2) -1) / 3);  */
       ox = (w / 2) * kappa, // control point offset horizontal
       oy = (h / 2) * kappa, // control point offset vertical
       xe = x + w,           // x-end
       ye = y + h,           // y-end
       xm = x + w / 2,       // x-middle
       ym = y + h / 2;       // y-middle

   myCtx.context.beginPath();
   myCtx.context.moveTo(x, ym);
   myCtx.context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
   myCtx.context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
   myCtx.context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
   myCtx.context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
   return this;
};


/**
 * class : G_RoundedRectangle
 */
EXTEND(G_RoundedRectangle,G_Shape); 
function G_RoundedRectangle(){this.type = "Rounded rectangle";this.closeShape = true;}

G_RoundedRectangle.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   
   return this;
};

G_RoundedRectangle.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1);
   return this;
};

G_RoundedRectangle.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      this.makePath(myCtx);
      if ( myCtx.fill === "solid" ){
         myCtx.context.fill();
      }
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};

G_RoundedRectangle.prototype.makePath = function(myCtx){
   var x1 = this.minX + myCtx.lineTreatment,
       y1 = this.minY + myCtx.lineTreatment,
       x2 = this.maxX + myCtx.lineTreatment,
       y2 = this.maxY + myCtx.lineTreatment;

   var r = Math.round(this.width()/8);
   if ( r > 20 ){
      r = 20;
   }
   
   var radian = Math.PI / 180;
   myCtx.context.beginPath();
   myCtx.context.moveTo(x1,y1+r);
   myCtx.context.arc(x1+r,y1+r,r,radian * 180,radian * 270,false);
   
   myCtx.context.lineTo(x2-r,y1);
   myCtx.context.arc(x2-r,y1+r,r,radian * 270,radian * 360,false);
   
   myCtx.context.lineTo(x2,y2-r);
   myCtx.context.arc(x2-r,y2-r,r,radian * 0,radian * 90,false);

   myCtx.context.lineTo(x1+r,y2);
   myCtx.context.arc(x1+r,y2-r,r,radian * 90,radian * 180,false);
   myCtx.context.lineTo(x1,y1+r);
       
   return this;
};
/**
 * class : G_Heart
 */
EXTEND(G_Heart,G_Shape); 
function G_Heart(){this.type = "Heart";this.closeShape = true;}

G_Heart.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   return this;
};

G_Heart.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1);
   return this;
};

G_Heart.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      this.makePath(myCtx);
      if ( myCtx.fill === "solid" ){
         myCtx.context.fill();
      }
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};

G_Heart.prototype.makePath = function(myCtx) {
   var x = this.minX, y = this.minY;
   var w = this.width(), h = this.height();
   
   var x0 = x + 0.5 * w, y0 = y + 0.3 * h;
   var x1 = x + 0.1 * w, y1 = y + 0.0 * h;
   var x2 = x + 0.0 * w, y2 = y + 0.6 * h;
   var x3 = x + 0.5 * w, y3 = y + 0.9 * h;
   var x4 = x + 1.0 * w, y4 = y + 0.6 * h;
   var x5 = x + 0.9 * w, y5 = y + 0.0 * h;
   myCtx.context.beginPath();
   myCtx.context.moveTo(x0,y0);
   myCtx.context.bezierCurveTo(x1,y1,x2,y2,x3,y3);
   myCtx.context.bezierCurveTo(x4,y4,x5,y5,x0,y0);
};

/**
 * class : G_RoundedRectangle
 */
EXTEND(RoundedRectangularCallout,G_Shape); 
function RoundedRectangularCallout(){this.type = "Rounded rectangular callout";this.closeShape = true;}

RoundedRectangularCallout.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   return this;
};

RoundedRectangularCallout.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset().init(arrNodes[0] * 1,arrNodes[1] * 1,arrNodes[2] * 1,arrNodes[3] * 1);
   return this;
};

RoundedRectangularCallout.prototype.draw = function(myCtx){
   if ( this.nodes.length === 2 ){
      this.makePath(myCtx);
      if ( myCtx.fill === "solid" ){
         myCtx.context.fill();
      }
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};

RoundedRectangularCallout.prototype.makePath = function(myCtx) {
   var x1 = this.minX + myCtx.lineTreatment,
       y1 = this.minY + myCtx.lineTreatment,
       x2 = this.maxX + myCtx.lineTreatment,
       y2 = this.maxY + myCtx.lineTreatment;
       
   var r = this.width()/8;
   if ( r > 20 ){
      r = 20;
   }
   var radian = Math.PI / 180;
   myCtx.context.beginPath();
   myCtx.context.moveTo(x1,y1+r);
   myCtx.context.arc(x1+r,y1+r,r,radian * 180,radian * 270,false);
   
   myCtx.context.lineTo(x2-r,y1);
   myCtx.context.arc(x2-r,y1+r,r,radian * 270,radian * 360,false);
   
   var dy = this.height() / 4;
   if ( dy > 30 ) {dy = 30;}
   myCtx.context.lineTo(x2,y2-dy-r);
   myCtx.context.arc(x2-r,y2-dy-r,r,radian * 0,radian * 90,false);

   var open_w = this.width()/4;
   var sx = this.width() / 4;
   if ( open_w > 30 ){open_w = 30;}
   
   myCtx.context.lineTo(x1+sx + open_w,y2-dy);
   myCtx.context.lineTo(x1+sx, y2);
   myCtx.context.lineTo(x1+sx, y2-dy);

   myCtx.context.lineTo(x1+r,y2-dy);
   myCtx.context.arc(x1+r,y2-dy-r,r,radian * 90,radian * 180,false);
   myCtx.context.lineTo(x1,y1+r);
};

/**
 * class : G_Polygon
 */
EXTEND(G_Polygon,G_Shape);  
function G_Polygon(){this.type = "Polygon";this.closeShape = true;}
G_Polygon.prototype.draw = function(myCtx){
   if ( this.nodes.length > 1 ){
      this.parent.draw.call(this,myCtx);
      
      myCtx.context.lineTo(this.nodes[0].x + myCtx.lineTreatment,this.nodes[0].y + myCtx.lineTreatment);

      if ( myCtx.fill === "solid" ){
         myCtx.context.fill();
      }
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};
G_Polygon.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset();
   var i;
   for ( i = 0; i < arrNodes.length; i += 2 ){
      this.addNode(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   return this;
};

/**
 * class : G_Polyline
 */
EXTEND(G_Polyline,G_Shape);  
function G_Polyline(){this.type = "Polyline";}
G_Polyline.prototype.draw = function(myCtx){
   if ( this.nodes.length > 1 ){
      myCtx.context.beginPath();
      myCtx.context.moveTo(this.nodes[0].x + myCtx.lineTreatment, this.nodes[0].y + myCtx.lineTreatment);
      var i;
      for ( i = 1; i < this.nodes.length; i ++ ){
          myCtx.context.lineTo(this.nodes[i].x + myCtx.lineTreatment, this.nodes[i].y + myCtx.lineTreatment);
      }

      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
   }
};
G_Polyline.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset();
   var i;
   for ( i = 0; i < arrNodes.length; i += 2 ){
      this.addNode(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   return this;
};

/**
 * class : G_CardinalSpline
 */
EXTEND(G_CardinalSpline,G_Shape);  
function G_CardinalSpline(closed){
   this.closed     = closed || false;
   this.closeShape = this.closed;
   this.type = (this.closed) ? "Closed cardinal spline" : "Cardinal spline";
}

G_CardinalSpline.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset();
   var i;
   for ( i = 0; i < arrNodes.length; i += 2 ){
      this.addNode(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   return this;
};

G_CardinalSpline.prototype.makePath = function(myCtx){
   if ( this.nodes.length > 2 ){
      var arr = [];
      var i;
      for ( i = 0; i < this.nodesCount(); i ++ ){
         var node = this.getNode(i);
         arr.push(node.x); arr.push(node.y);
      }
      
      myCtx.context.beginPath();
      myCtx.context.moveTo(arr[0],arr[1]);
      this.cardinalSpline(myCtx.context,arr,0,0.1,this.closed,0,0);
   }
};

G_CardinalSpline.prototype.draw = function(myCtx){
   if ( this.nodes.length > 2 ){
      this.makePath(myCtx);
      if ( this.closed && myCtx.fill === "solid" ){
         myCtx.context.fill();
      }
      
      if ( myCtx.outline === "solid" ){
         myCtx.context.stroke();
      }
      
   }
};

G_CardinalSpline.prototype.cardinalSpline = function(p, pts, start, slack, closed, tx, ty){
   var npoints = pts.length / 2;
   // compute the size of the path
   var len = 2*npoints;
   var end = start+len;

   if ( len < 6 ) {
      alert("To create spline requires at least 3 points");
      return;
   }

   var dx1, dy1, dx2, dy2;

   // compute first control point
   if ( closed ) {
      dx2 = pts[start+2]-pts[end-2];
      dy2 = pts[start+3]-pts[end-1];
   }else {
      dx2 = pts[start+4]-pts[start];
      dy2 = pts[start+5]-pts[start+1];
   }

   // repeatedly compute next control point and append curve
   var i;
   for ( i=start+2; i<end-2; i+=2 ) {
      dx1 = dx2; dy1 = dy2;
      dx2 = pts[i+2]-pts[i-2];
      dy2 = pts[i+3]-pts[i-1];
      p.bezierCurveTo(tx+pts[i-2]+slack*dx1, ty+pts[i-1]+slack*dy1,
                      tx+pts[i]  -slack*dx2, ty+pts[i+1]-slack*dy2,
                      tx+pts[i],             ty+pts[i+1]);
   }

   // compute last control point
   if ( closed ) {
       dx1 = dx2; dy1 = dy2;
       dx2 = pts[start]-pts[i-2];
       dy2 = pts[start+1]-pts[i-1];
       p.bezierCurveTo(tx+pts[i-2]+slack*dx1, ty+pts[i-1]+slack*dy1,
                       tx+pts[i]  -slack*dx2, ty+pts[i+1]-slack*dy2,
                       tx+pts[i],             ty+pts[i+1]);
       
       dx1 = dx2; dy1 = dy2;
       dx2 = pts[start+2]-pts[end-2];
       dy2 = pts[start+3]-pts[end-1];
       p.bezierCurveTo(tx+pts[end-2]+slack*dx1, ty+pts[end-1]+slack*dy1,
                       tx+pts[0]    -slack*dx2, ty+pts[1]    -slack*dy2,
                       tx+pts[0],               ty+pts[1]);
       p.closePath();
   }else {
       p.bezierCurveTo(tx+pts[i-2]+slack*dx2, ty+pts[i-1]+slack*dy2,
                       tx+pts[i]  -slack*dx2, ty+pts[i+1]-slack*dy2,
                       tx+pts[i],             ty+pts[i+1]);
   }
   return this;
};



/**
 * class : G_GeneratedShape
 */
EXTEND(G_GeneratedRectShape,G_Shape); 
function G_GeneratedRectShape(){
   this.type = "Generated rectangular shape";
   this.transformed = false;
   this.closeShape = true;
}

G_GeneratedRectShape.prototype.init = function(left,top,right,bottom){
   this.addNode(new G_Point(left,top))
       .addNode(new G_Point(right,bottom));
   return this;
};

G_GeneratedRectShape.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset();
   var i;
   for ( i = 0; i < arrNodes.length; i += 2 ){
      this.addNode(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   this.transformed = true;
   return this;
};

G_GeneratedRectShape.prototype.reset = function(){
   ////////////////////////////////////////////////////////////
   //                                                        //
   // ATTENTION:                                             //
   //                                                        //
   // this.parent.reset.call(this);                          //
   // If use this line to replace the following two lines,   //
   // browser will complain too much recursion error         //  
   //                                                        //
   ////////////////////////////////////////////////////////////
   
   this.nodes = [];
   this.minX = this.minY = this.maxX = this.maxY = 0;
   
   this.transformed = false;
   return this;
};

G_GeneratedRectShape.prototype.draw = function(myCtx){
   if ( this.transformed ){
      if ( this.nodes.length > 1 ){
      
         myCtx.context.beginPath();
         myCtx.context.moveTo(this.nodes[0].x + myCtx.lineTreatment, this.nodes[0].y + myCtx.lineTreatment);
         var i;
         for ( i = 1; i < this.nodes.length; i ++ ){
            myCtx.context.lineTo(this.nodes[i].x + myCtx.lineTreatment, this.nodes[i].y + myCtx.lineTreatment);
         }
         myCtx.context.lineTo(this.nodes[0].x + myCtx.lineTreatment,this.nodes[0].y + myCtx.lineTreatment);

         if ( myCtx.fill === "solid" ){
            myCtx.context.fill();
         }
         if ( myCtx.outline === "solid" ){
            myCtx.context.stroke();
         }
      }
   }else{
      if ( this.nodes.length === 2 ){
         this.generate().draw(myCtx);
      }
   }
};

G_GeneratedRectShape.prototype.createPolygon = function(arms, cx, cy, radius){    
   var angle = Math.PI / arms * 2, x, y;
   var g_polygon =  new G_Polygon().reset();
   var i;
   for (i = 0; i < arms; i++){
      x = cx + Math.cos(i * angle - Math.PI/2) * radius;
      y = cy + Math.sin(i * angle - Math.PI/2) * radius;
      g_polygon.addNode(x,y);
   }
   return g_polygon;
};
G_GeneratedRectShape.prototype.createStar = function ( arms, cx, cy, rOuter, rInner){    
   var angle = Math.PI / arms, x, y;
   var g_polygon =  new G_Polygon().reset();
   var i;
   for (i = 0; i < 2 * arms; i++){
      var r = ((i % 2) === 0 )? rOuter : rInner;

      x = cx + Math.cos(i * angle - Math.PI/2) * r;
      y = cy + Math.sin(i * angle - Math.PI/2) * r;
      g_polygon.addNode(x,y);
   }
   return g_polygon;
};


/**
 * class : G_MultipointStar
 */
EXTEND(G_MultipointStar,G_GeneratedRectShape); 
function G_MultipointStar(n){
   this.type = n + "-point star";
   this.vertices = n;
}
G_MultipointStar.prototype.generate = function(){
   var radius = Math.sqrt(this.width() * this.width() + this.height() * this.height());
   if ( this.vertices < 6 ){
      return this.createStar(this.vertices,this.nodes[0].x,this.nodes[0].y,radius,radius *0.4);
   }
   return this.createStar(this.vertices,this.nodes[0].x,this.nodes[0].y,radius,radius *0.6);
};
G_MultipointStar.prototype.transform = function(){
   var cx = this.nodes[0].x, cy = this.nodes[0].y;
   var rOuter = Math.sqrt(this.width() * this.width() + this.height() * this.height());
   var rInner;
   if ( this.vertices < 6 ){
      rInner = rOuter * 0.4;
   }else{
      rInner = rOuter * 0.6;
   }
   
   this.reset();   
   var angle = Math.PI / this.vertices, x, y;
   var i;
   for (i = 0; i < 2 * this.vertices; i++){
      var r = ((i % 2) === 0 )? rOuter : rInner;

      x = cx + Math.cos(i * angle - Math.PI/2) * r;
      y = cy + Math.sin(i * angle - Math.PI/2) * r;
      this.addNode(x,y);
   }
   this.transformed = true;
   return this;
};


/**
 * class : G_RightPolygon
 */
EXTEND(G_RightPolygon,G_GeneratedRectShape); 
function G_RightPolygon(n){
   switch(n){
   case 3: this.type = "Triangle"; break;
   case 4: this.type = "Diamond"; break;
   case 5: this.type = "Pentagon"; break;
   case 6: this.type = "Hexagon"; break;
   default: this.type = n + "point polygon"; break;
   }
   this.vertices = n;
}
G_RightPolygon.prototype.generate = function(){
   var radius = Math.sqrt(this.width() * this.width() + this.height() * this.height());
   
   return this.createPolygon(this.vertices,this.nodes[0].x,this.nodes[0].y,radius);
};

G_RightPolygon.prototype.transform = function(){
   var radius = Math.sqrt(this.width() * this.width() + this.height() * this.height());
   var cx = this.nodes[0].x, cy = this.nodes[0].y;

   this.reset();   
   var angle = Math.PI / this.vertices * 2, x, y;
   var i;
   for (i = 0; i < this.vertices; i++){
      x = cx + Math.cos(i * angle - Math.PI/2) * radius;
      y = cy + Math.sin(i * angle - Math.PI/2) * radius;
      this.addNode(x,y);
   }
   this.transformed = true;
   return this;
};

/**
 * class : G_Arrow
 */
EXTEND(G_Arrow,G_GeneratedRectShape); 
function G_Arrow(sType){
   switch(sType){
   case "left" : this.type = "Left arrow"; break;
   case "right": this.type = "Right arrow"; break;
   case "up"   : this.type = "Up arrow"; break;
   case "down" : this.type = "Down arrow"; break;
   }
   this.ArrowType = sType;
}
G_Arrow.prototype.generate = function(){
   return this.create(this.ArrowType,true);
};

G_Arrow.prototype.transform = function(){
   return this.create(this.ArrowType,false);
};

G_Arrow.prototype.create = function(sType,flag){
   var arr = {left:[
                     new G_Point(this.minX + this.width()/2,this.minY),
                     new G_Point(this.minX + this.width()/2,this.minY + this.height()/4),
                     new G_Point(this.maxX,this.minY + this.height()/4),
                     new G_Point(this.maxX,this.minY + (this.height()/4) * 3),
                     new G_Point(this.minX + this.width()/2,this.minY + (this.height()/4) * 3),
                     new G_Point(this.minX + this.width()/2,this.maxY),
                     new G_Point(this.minX,this.minY + this.height()/2)
                  ],
              right:[
                     new G_Point(this.minX + this.width()/2,this.minY),
                     new G_Point(this.maxX,this.minY + this.height()/2),
                     new G_Point(this.minX + this.width()/2,this.maxY),
                     new G_Point(this.minX + this.width()/2,this.minY + (this.height()/4) * 3),
                     new G_Point(this.minX,this.minY + (this.height()/4) * 3),
                     new G_Point(this.minX,this.minY + (this.height()/4) ),
                     new G_Point(this.minX+ this.width()/2,this.minY + this.height()/4)
                  ],
              up:[
                     new G_Point(this.minX + this.width()/2,this.minY),
                     new G_Point(this.maxX,this.minY + this.height()/2),
                     
                     new G_Point(this.minX + (this.width()/4) * 3,this.minY + this.height()/2),
                     new G_Point(this.minX + (this.width()/4) * 3,this.maxY),
                     new G_Point(this.minX + (this.width()/4),this.maxY),
                     
                     new G_Point(this.minX + (this.width()/4),this.minY + this.height()/2),
                     new G_Point(this.minX ,this.minY + this.height()/2)
                  ],
              down:[
                     new G_Point(this.minX + this.width()/2,this.maxY),
                     new G_Point(this.maxX,this.minY + this.height()/2),
                     new G_Point(this.minX + (this.width()/4) * 3,this.minY + this.height()/2),
                     
                     new G_Point(this.minX + (this.width()/4) * 3,this.minY),
                     new G_Point(this.minX + (this.width()/4),this.minY),
                     
                     new G_Point(this.minX + (this.width()/4),this.minY + this.height()/2),
                     new G_Point(this.minX ,this.minY + this.height()/2)
                  ]
             };
   if ( flag ){
      var g_polygon =  new G_Polygon().reset();
      var i;
      for ( i = 0; i < arr[sType].length; i ++ ){
         g_polygon.addNode(arr[sType][i]);
      }
      return g_polygon;
   }else{
      this.reset();
      var i;
      for ( i = 0; i < arr[sType].length; i ++ ){
         this.addNode(arr[sType][i]);
      }
      this.transformed = true;
      return this;
   }
};

EXTEND(G_PolygonSelection,G_Shape);  
function G_PolygonSelection(){
   this.type = "Selection";
   this.ImageData = null;
   this.closeShape = true;
}
G_PolygonSelection.prototype.makePath = function(myCtx){
   myCtx.context.beginPath();
   var cnt = this.nodesCount();
   myCtx.context.moveTo(this.firstNode().x + myCtx.lineTreatment,
                        this.firstNode().y + myCtx.lineTreatment);
                        
   var i;
   for ( i = 1; i < cnt; i ++ ){
      var node1 = this.getNode(i);
      myCtx.context.lineTo(node1.x + myCtx.lineTreatment, node1.y + myCtx.lineTreatment);
   }
   myCtx.context.lineTo(this.firstNode().x + myCtx.lineTreatment,
                        this.firstNode().y + myCtx.lineTreatment);
};
G_PolygonSelection.prototype.putImage = function(ctx,imgData,x,y){
   var canvas = document.createElement("canvas");
   canvas.width = imgData.width; canvas.height = imgData.height;
   canvas.getContext("2d").putImageData(imgData,0,0);
   ctx.drawImage(canvas,x,y);
   canvas = null;
};
G_PolygonSelection.prototype.draw = function(myCtx,ImageOnly){
   if ( ImageOnly ){
      if ( this.ImageData ){
         this.putImage(myCtx.context,this.ImageData,this.minX,this.minY);
      }
   }else{
      if ( this.nodes.length > 1 ){
         myCtx.context.beginPath();
         var cnt = this.nodesCount();
         var i;
         for ( i = 1; i < cnt; i ++ ){
            var node0 = this.getNode(i-1);
            var node1 = this.getNode(i);
            dashedLine(myCtx.context,
                       node0.x + myCtx.lineTreatment, node0.y + myCtx.lineTreatment,
                       node1.x + myCtx.lineTreatment, node1.y + myCtx.lineTreatment,
                       [3,3]);
            myCtx.context.stroke();           
         }
         var node0 = this.lastNode();
         var node1 = this.firstNode();
         dashedLine(myCtx.context,
                    node0.x + myCtx.lineTreatment, node0.y + myCtx.lineTreatment,
                    node1.x + myCtx.lineTreatment, node1.y + myCtx.lineTreatment,
                    [3,3]);
         myCtx.context.stroke();
      }
      if ( this.ImageData ){
         this.putImage(myCtx.context,this.ImageData,this.minX,this.minY);
      }
   }
   return this;
};

G_PolygonSelection.prototype.select = function(canvas,cut){
   this.ImageData = canvas.getContext("2d").getImageData(this.minX,this.minY,this.width(),this.height());

   // store selected image data to a new created canvas
   var canvas0 = document.createElement("canvas");
   canvas0.width = this.ImageData.width;canvas0.height = this.ImageData.height;
   canvas0.getContext("2d").putImageData(this.ImageData,0,0);
   
   var canvas1 = document.createElement("canvas");
   canvas1.width = canvas.width;canvas1.height = canvas.height;
   var draft1 = canvas1.getContext("2d");
   // Copy selected image to draft
   this.makePath({context:draft1,lineTreatment:0.5});
   draft1.save();
   draft1.clip();
   draft1.drawImage(canvas0,0,0,this.ImageData.width,this.ImageData.height,this.minX,this.minY,this.width(),this.height());
   draft1.restore();
   
   // get selected imgData
   this.ImageData = draft1.getImageData(this.minX,this.minY,this.width(),this.height());
   canvas0 = canvas1 = null;
   
   if ( cut ){
      this.makePath({context:canvas.getContext("2d"),lineTreatment:0.5});
      canvas.getContext("2d").save();
      canvas.getContext("2d").clip();
      canvas.getContext("2d").clearRect(this.minX,this.minY,this.width(),this.height());
      canvas.getContext("2d").restore();
   }
   return this;
};

G_PolygonSelection.prototype.rotate = function(degree){
   this.ImageData = new ImageProcessor(this.ImageData).rotate(degree);
   this.parent.rotate.call(this,degree,false);
   return this;
};

G_PolygonSelection.prototype.deserialize = function(data,delimiter){
   delimiter = delimiter || "|";
   var arr = data.split(delimiter);
   var arrNodes  = arr[2].split(",");
   this.reset();
   var i;
   for ( i = 0; i < arrNodes.length; i += 2 ){
      this.addNode(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   return this;
};
G_Shape.prototype._makePath = function(ctx,arrData,closeShape){
   var i,x,y,x0,y0;
   ctx.context.beginPath();
   for (i = 0; i < arrData.length; i += 2 ){
      x = arrData[i] * 1;
      y = arrData[i + 1] * 1;
      if ( i === 0 ){
         ctx.context.moveTo(x,y);
         x0 = x; y0 = y;
      }else{
         ctx.context.lineTo(x,y);
      }
   }
   if ( closeShape === "1" ){
      ctx.context.lineTo(x0,y0);
   }
   return this;
};
G_Shape.drawShape = function(ctx,sData){
   var shape = G_Shape.getShape(sData);
   if ( shape ){
      shape.makePath(ctx);
      if ( shape.closeShape ){
         ctx.context.closePath();
      }
      if ( ctx.fill === "solid" && shape.closeShape ){
         ctx.context.fill();
      }
      if ( ctx.outline === "solid" ){
         ctx.context.stroke();
      }
   }
   return sData;
};

G_Shape.getShape = function(sData,delimiter){
   delimiter = delimiter || "|";
   var arr = sData.split(delimiter);
   var type = arr[0];
   switch(type){
   case "Line":
      return new G_Line().deserialize(sData,delimiter);
   case "Polyline":
      return new G_Polyline().deserialize(sData,delimiter);      
   case "Pentagon":
   case "Diamond":
   case "4-point star":
   case "5-point star":
   case "6-point star":
   case "Polygon":
   case "Triangle":
   case "Hexagon":
   case "Right arrow":
   case "Left arrow":
   case "Up arrow":
   case "Down arrow":
      return new G_Polygon().deserialize(sData,delimiter);
   case "Bezier curve":
      return new G_Curve().deserialize(sData,delimiter);
   case "Oval":
      return new G_Oval().deserialize(sData,delimiter);
   case "Cardinal spline":
      return new G_CardinalSpline(false).deserialize(sData,delimiter);
   case "Closed cardinal spline":
      return new G_CardinalSpline(true).deserialize(sData,delimiter);
   case "Rounded rectangular callout":
      return new RoundedRectangularCallout().deserialize(sData,delimiter);
   case "Heart":
      return new G_Heart().deserialize(sData,delimiter);
   case "Rectangle":
      return new G_Rectangle().deserialize(sData,delimiter);
   case "Rounded rectangle":
      return new G_RoundedRectangle().deserialize(sData,delimiter);
   }

   return null;
};