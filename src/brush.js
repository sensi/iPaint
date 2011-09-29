//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : Brush
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------

/*
http://www.openrise.com/lab/FlowerPower/
*/
function Brush(){
   this.type = "brush";
}

Brush.prototype={
   ObjectType    : "brush",
   strokePressure: 1,
   pressureFactor: 0.05,
   paintApp      : null,
   strokeStarted : false,
   dirty         : false,
   mouseX        : null,
   mouseY        : null,
   init          : function(paintApp){
                      this.paintApp   =  paintApp;
                      this.paintApp.context_draft.globalCompositeOperation = "source-over";
                      
                      return this;
                   },
   clearBoundingBox: function(){},                
   destroy       : function(){},
   strokeStart   : function(x,y){},
   stroke        : function(x,y){},
   strokeEnd     : function(){},
   setPaintingProperty: function(){
      this.paintApp.context_draft.lineWidth   = this.paintApp.lineWidth();
      this.paintApp.context_draft.lineCap     = "butt";
      this.paintApp.context_draft.lineJoin    = "round";
      this.paintApp.context.fillStyle         = "rgba(" + this.paintApp.backColor().r + ", " + 
                                                          this.paintApp.backColor().g + ", " +
                                                          this.paintApp.backColor().b + ", " +
                                                          this.pressureFactor * this.strokePressure+")";
                                                          
      this.paintApp.context_draft.strokeStyle = "rgba(" + this.paintApp.foreColor().r + ", " + 
                                                          this.paintApp.foreColor().g + ", " +
                                                          this.paintApp.foreColor().b + ", " +
                                                          this.pressureFactor * this.strokePressure+")";
   },
   done:function(no_copy){
      if ( this.dirty ){
         if ( !no_copy ){
            this.paintApp.context.drawImage(document.getElementById(this.paintApp.getID("canvas_temp")), 0, 0);
            this.paintApp.context_draft.clearRect(0, 0, this.paintApp.width, this.paintApp.height);	
         }
         
         if ( this.paintApp.fnActionComplete ){
            this.paintApp.fnActionComplete(this);
         }
         if ( typeof (this.onDone) === "function" ){
            this.onDone(this);
         }
         this.dirty = false;
      }
   }
};


EXTEND(SimpleBrush,Brush);
function SimpleBrush(){
   this.type = "Simple brush";
   this.pressureFactor = 0.5;
   this.nodes          = [];
}

SimpleBrush.prototype.strokeStart = function(x,y){
   if ( !this.strokeStarted ){
      this.strokeStarted = true;
      this.mouseX = x;
      this.mouseY = y;
      this.nodes = [];
      this.nodes.push(x); this.nodes.push(y);
   }
};
SimpleBrush.prototype.stroke = function(x,y){
   if ( this.strokeStarted ){
      this.paintApp.context_draft.save();
      this.setPaintingProperty();
      
      this.paintApp.context_draft.beginPath();
      this.paintApp.context_draft.moveTo(this.mouseX,this.mouseY);
      this.paintApp.context_draft.lineTo(x,y);
      this.paintApp.context_draft.stroke();
      
      this.paintApp.context_draft.restore();

      this.mouseX = x;
      this.mouseY = y;
      this.nodes.push(x); this.nodes.push(y);
      this.dirty = true;
   }
};
SimpleBrush.prototype.strokeEnd = function(no_copy){
   if ( this.strokeStarted ){
      this.strokeStarted = false;
      this.done(no_copy);
      this.paintApp.canvas_history.add(this.type,["simplebrush",this.nodes.join(",")].join("|"));
   }
};
SimpleBrush.prototype.deserialize = function(s,delimiter){
   delimiter = delimiter || "|";

   var arr = s.split(delimiter);
   var arrNodes = arr[1].split(","),i;
   this.strokeStart(arrNodes[0] * 1,arrNodes[1] * 1);
   for ( i = 2; i < arrNodes.length; i += 2 ){
      this.stroke(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   this.strokeEnd(true);
   return this;
};


EXTEND(ShapeBrush,Brush);
function ShapeBrush(){
   this.type = "Shape brush";
   this.pressureFactor = 1;
   this.nodes = [];
}

ShapeBrush.prototype.strokeStart = function(x,y){
   if ( !this.strokeStarted ){
      this.strokeStarted = true;
      this.mouseX = x;
      this.mouseY = y;
      this.nodes = [];
      this.nodes.push(x); this.nodes.push(y);
   }
};
ShapeBrush.prototype.stroke = function(x,y){
   if ( this.strokeStarted ){
      this.paintApp.context_draft.save();
      this.setPaintingProperty();
      
      var dx,dy,g,e,c;
      dx = x - this.mouseX;
      dy = y - this.mouseY;
      g = 1.57079633;
      e = Math.cos(g) * dx - Math.sin(g) * dy;
      c = Math.sin(g) * dx + Math.cos(g) * dy;

      var shape = new G_Shape();
      shape.addNode(this.mouseX - e, this.mouseY - c)
           .addNode(this.mouseX + e, this.mouseY + c)
           .addNode(x + e, y + c)
           .addNode(x - e, y - c);
      
      this.paintApp.context_draft.fillStyle = this.getGradient(this.paintApp.context_draft,shape);
      
      this._drawCircle(this.paintApp.context_draft,shape);
      this.paintApp.context_draft.fill();
      
      this.paintApp.context_draft.restore();

      this.mouseX = x;
      this.mouseY = y;
      
      this.nodes.push(x); this.nodes.push(y);
      this.dirty = true;
   }
};
ShapeBrush.prototype.strokeEnd = function(no_copy){
   if ( this.strokeStarted ){
      this.strokeStarted = false;
      this.done(no_copy);
      this.paintApp.canvas_history.add(this.type,["shapebrush",this.nodes.join(",")].join("|"));
   }
};

ShapeBrush.prototype._drawEllipse = function(ctx,x1,y1,x2,y2){
   var KAPPA = 4 * ((Math.sqrt(2) -1) / 3);

   var rx = (x2-x1)/2;
   var ry = (y2-y1)/2;

   var cx = x1+rx;
   var cy = y1+ry;

   ctx.beginPath();
   ctx.moveTo(cx, cy - ry);
   ctx.bezierCurveTo(cx + (KAPPA * rx), cy - ry,  cx + rx, cy - (KAPPA * ry), cx + rx, cy);
   ctx.bezierCurveTo(cx + rx, cy + (KAPPA * ry), cx + (KAPPA * rx), cy + ry, cx, cy + ry);
   ctx.bezierCurveTo(cx - (KAPPA * rx), cy + ry, cx - rx, cy + (KAPPA * ry), cx - rx, cy);
   ctx.bezierCurveTo(cx - rx, cy - (KAPPA * ry), cx - (KAPPA * rx), cy - ry, cx, cy - ry);
};

ShapeBrush.prototype._drawCircle = function(ctx,shape){
   var x1 = shape.minX, y1 = shape.minY,
       x2 = shape.maxX, y2 = shape.maxY;
       
   var w = x2 - x1, h = y2 - y1;
   var xc = x1 + w/2, yc = y1 + h/2;
   var r = Math.min(w/2,h/2);
   
   ctx.beginPath();
   ctx.arc(xc,yc,r,0,(Math.PI/180)*360,true);
};   

ShapeBrush.prototype._drawBox = function(ctx,shape){
   ctx.beginPath();
   shape.makePath({context:ctx,lineTreatment:0.5});
   ctx.closePath();
};   

ShapeBrush.prototype.getGradient = function(ctx,shape){
   var x1 = shape.minX, y1 = shape.minY,
       x2 = shape.maxX, y2 = shape.maxY;

   var w = x2 - x1, h = y2 - y1;
   var xc = x1 + w/2, yc = y1 + h/2;
   var r = Math.max(w/2,h/2);
   
   var rad = ctx.createRadialGradient(xc,yc,1,xc,yc,r);
   rad.addColorStop(0,this.paintApp.colorStr(this.paintApp.backColor()));
   
   var clr = this.paintApp.foreColor(); 
   rad.addColorStop(1,this.paintApp.colorStr(clr));
   return rad;
};
ShapeBrush.prototype.deserialize = function(s,delimiter){
   delimiter = delimiter || "|";

   var arr = s.split(delimiter),i;
   var arrNodes = arr[1].split(",");
   this.strokeStart(arrNodes[0] * 1,arrNodes[1] * 1);
   for ( i = 2; i < arrNodes.length; i += 2 ){
      this.stroke(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   this.strokeEnd(true);
   return this;
};



EXTEND(HairBrush,Brush);
function HairBrush(){
   this.type = "Hair brush";
   this.pressureFactor = 0.1;
   this.points = [];
   this.count  = 0;
   this.nodes  = [];
}

HairBrush.prototype.strokeStart = function(x,y){
   if ( !this.strokeStarted ){
      this.strokeStarted = true;
      this.mouseX = x;
      this.mouseY = y;
      this.nodes = [];
      this.nodes.push(x); this.nodes.push(y);
   }
};
HairBrush.prototype.stroke = function(x,y){
   if ( this.strokeStarted ){
      this.paintApp.context_draft.save();
      this.setPaintingProperty();
      
      var e,b,a,g;
      this.points.push([x,y]);
      this.paintApp.context_draft.beginPath();
      //this.paintApp.context_draft.moveTo(this.mouseX,this.mouseY);
      //this.paintApp.context_draft.lineTo(x,y);
      //this.paintApp.context_draft.stroke();
      for( e = 0; e < this.points.length; e++){
         b = this.points[e][0]-this.points[this.count][0];
         a = this.points[e][1]-this.points[this.count][1];
         g = b*b + a*a;
         if( g < 3000 && Math.random() > g/3000 ){
            this.paintApp.context_draft.beginPath();
            this.paintApp.context_draft.moveTo(x+(b*0.5),y+(a*0.5));
            this.paintApp.context_draft.lineTo(x-(b*0.5),y-(a*0.5));
            this.paintApp.context_draft.stroke();
         }
      }
      this.count++;
      this.paintApp.context_draft.restore();

      this.mouseX = x;
      this.mouseY = y;
      this.nodes.push(x); this.nodes.push(y);
      this.dirty = true;
   }
};
HairBrush.prototype.strokeEnd = function(no_copy){
   if ( this.strokeStarted ){
   
      this.strokeStarted = false;
      this.done(no_copy);
      this.paintApp.canvas_history.add(this.type,["hairbrush",this.nodes.join(",")].join("|"));
   }
};

HairBrush.prototype.deserialize = function(s,delimiter){
   delimiter = delimiter || "|";

   var arr = s.split(delimiter),i;
   var arrNodes = arr[1].split(",");
   this.strokeStart(arrNodes[0] * 1,arrNodes[1] * 1);
   for ( i = 2; i < arrNodes.length; i += 2 ){
      this.stroke(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   this.strokeEnd(true);
   return this;
};


EXTEND(LongHairBrush,Brush);
function LongHairBrush(){
   this.type = "Long fur brush";
   this.pressureFactor = 0.05;
   this.points = [];
   this.count = 0;
}

LongHairBrush.prototype.strokeStart = function(x,y){
   if ( !this.strokeStarted ){
      this.strokeStarted = true;
   }
   this.nodes = [];
   this.nodes.push(x); this.nodes.push(y);
   this.points = [];
};
LongHairBrush.prototype.stroke = function(x,y){
   if ( this.strokeStarted ){
      this.paintApp.context_draft.save();
      this.setPaintingProperty();
      
      var e,b,a,h,v1,v2,i;
      this.points.push([x,y]);
      var start = 0;
      var threshold = 3000;
      for (i = start; i < this.points.length; i++){
         e = -Math.random();
         b = this.points[i][0] - this.points[this.count][0];
         a = this.points[i][1] - this.points[this.count][1];
         h = b*b+a*a;
         v1 = a * e; v2 = b * e;
         if ( h < threshold && Math.random() > h / (threshold) ){
            this.paintApp.context_draft.beginPath();
            this.paintApp.context_draft.moveTo(this.points[this.count][0]+v2,this.points[this.count][1]+v1);
            this.paintApp.context_draft.lineTo(this.points[i][0]-v2+Math.random()*2,this.points[i][1]-v1+Math.random()*2);
            this.paintApp.context_draft.stroke();
         }
      }
      this.count++;
      
      this.paintApp.context_draft.restore();
      this.dirty = true;
      this.nodes.push(x); this.nodes.push(y);
   }
};
LongHairBrush.prototype.strokeEnd = function(no_copy){
   if ( this.strokeStarted ){
      this.strokeStarted = false;
      this.done(no_copy);
      this.paintApp.canvas_history.add(this.type,["longhairbrush",this.nodes.join(",")].join("|"));
   }
};
LongHairBrush.prototype.deserialize = function(s,delimiter){
   delimiter = delimiter || "|";

   var arr = s.split(delimiter),i;
   var arrNodes = arr[1].split(",");
   this.strokeStart(arrNodes[0] * 1,arrNodes[1] * 1);
   for ( i = 2; i < arrNodes.length; i += 2 ){
      this.stroke(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   this.strokeEnd(true);
   return this;
};

EXTEND(RibbonBrush,Brush);
function RibbonBrush(){
   this.type           = "Ribbon brush";
   this.painters       = null;
   this.interval       = null;
   this.painterCapcity = 50;
   this.pressureFactor = 0.05;
   this.nodes          = [];
}

RibbonBrush.prototype.init = function(paintApp){
   Brush.prototype.init.call(this,paintApp);

   var this_brush = this, i;

   this.mouseX   = window.innerWidth/2;
   this.mouseY   = window.innerHeight/2;
   this.painters = [];
   for ( i = 0; i < this.painterCapcity; i++ ){
      this.painters.push({
         dx   : window.innerWidth/2,
         dy   : window.innerHeight/2,
         ax   : 0,
         ay   : 0,
         div  : 0.1,
         ease : Math.random()*0.2+0.6
      });
   }
   this.interval=setInterval(draw,10);
   this.nodes = [];
   
   function draw(){
      this_brush.draw(this_brush.mouseX,this_brush.mouseY);
   }
   return this;
};

RibbonBrush.prototype.draw = function(x,y){
   if ( !this.strokeStarted ){ return; }
   var i;
   this.paintApp.context_draft.save();
   this.setPaintingProperty();

   for( i = 0; i < this.painterCapcity; i++ ){
      this.paintApp.context_draft.beginPath();
      this.paintApp.context_draft.moveTo(this.painters[i].dx,this.painters[i].dy);
      
      this.painters[i].ax = (this.painters[i].ax + (this.painters[i].dx - x) * this.painters[i].div) * this.painters[i].ease;
      this.painters[i].ay = (this.painters[i].ay + (this.painters[i].dy - y) * this.painters[i].div) * this.painters[i].ease;
      
      this.painters[i].dx -= this.painters[i].ax;
      this.painters[i].dy -= this.painters[i].ay;

      this.paintApp.context_draft.lineTo( this.painters[i].dx, this.painters[i].dy );
      this.paintApp.context_draft.stroke();
      
      this.dirty = true;
      
   }
   this.paintApp.context_draft.restore();
   this.nodes.push(x,y);
};

RibbonBrush.prototype.destroy = function(){
   clearInterval(this.interval);
   this.interval = null;
};
RibbonBrush.prototype.strokeStart = function(x,y){
   if ( !this.strokeStarted ){
      var i;
      this.strokeStarted = true;
      this.mouseX = x; this.mouseY = y;
      this.nodes = [];
      this.nodes.push(x); this.nodes.push(y);
      for(i = 0; i < this.painterCapcity; i++){
         this.painters[i].dx = x;
         this.painters[i].dy = y;
      }
   }
};
RibbonBrush.prototype.stroke = function(x,y){
   if ( this.strokeStarted ){
      this.mouseX = x; this.mouseY = y;
   }
};
RibbonBrush.prototype.strokeEnd = function(no_copy){
   if ( this.strokeStarted ){
      this.strokeStarted = false;
      this.done(no_copy);
      this.paintApp.canvas_history.add(this.type,["ribbonbrush",this.nodes.join(",")].join("|"));
   }
};

RibbonBrush.prototype.deserialize = function(s,delimiter){
   delimiter = delimiter || "|";

   var arr = s.split(delimiter),i;
   var arrNodes = arr[1].split(",");
   this.strokeStart(arrNodes[0] * 1,arrNodes[1] * 1);
   for ( i = 2; i < arrNodes.length; i += 2 ){
      this.draw(arrNodes[i] * 1,arrNodes[i+1] * 1);
   }
   this.strokeEnd(true);
   return this;
};
