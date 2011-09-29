//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : jsSliderControl
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function jsSliderControl(rangeStart,rangeEnd,dec,initPos){
   this.rangeStart = rangeStart;
   this.rangeEnd   = rangeEnd;
   this.length     = 0;
   this.decimals   = dec;
   this.currentPos = initPos || 0;
}

jsSliderControl.prototype.toSlider = function(pos){
   return Math.round(this.length * pos / 100);
};

jsSliderControl.prototype.toRange = function(x){
   var r = this.rangeStart + x / this.length * (this.rangeEnd - this.rangeStart);
   return r.toFixed(this.decimals);
};

jsSliderControl.prototype.setPosition = function(pos){
   var nPos = this.toSlider(pos);
   $(this.element).children(".slider_knob")
       .css("left",nPos + "px");
   
   this.currentPos = this.toRange(nPos);
};

jsSliderControl.prototype.moveTo = function(pos){
   this._moveTo(this.toSlider(pos),null);
};

jsSliderControl.prototype._moveTo = function(x,y){
   $(this.element).children(".slider_knob")
       .css("left",x + "px");
   
   this.currentPos = this.toRange(x);
   if ( this.onDrag ){
      this.onDrag(this.currentPos);
   }
};

jsSliderControl.prototype.showTip = function(x,msg){
   if ( this.customTip ){
      msg = this.customTip(msg);
   }
   if ( x ){
      var p_w = $(this.element).width(),
          n_w = $(this.element).children(".slider_knob").width(),
          c_w = $(this.element).children(".tip").width();
      x = x - c_w / 2 + n_w / 2;
      if ( x + c_w  > p_w ){
         x = p_w - c_w;
      }
      if ( x < 0 ){
         x = 0;
      }
      $(this.element).children(".tip")
                     .css({"left": x + "px",display:""})
                     .html(msg);
   }else{
      $(this.element).children(".tip")
                     .html(msg);
   }                     
};
jsSliderControl.prototype.customTip = function(r){
   return r;
};
jsSliderControl.prototype.hideTip = function(x,msg){
   $(this.element).children(".tip")
                  .css({display:"none"});
};

jsSliderControl.prototype.init = function(e){
   this.length = $(e).children(".slider_bar").width();
   this.element = e;
   var slider = this;
   $(e).append(
         $("<div class='tip'></div>")
         .css({"left":this.toSlider(this.currentPos) + "px","display":"none"})
   );
   
   $(e).children(".slider_knob")
       .each(
          function(){
             var top   = $(e).offset().top;
             
             Drag.init(this,null,0,slider.length,0,0);
             slider.moveTo(slider.currentPos);
             
             this.onDragStart = function(evt,x,y){                
             };
             
             this.onDragEnd = function(evt,x,y){
                slider.hideTip();
                if ( slider.onDragEnd ){
                   slider.onDragEnd(slider.toRange(x));
                }
             };
             
             this.onDrag = function(evt,nx,ny){
                slider._moveTo(nx);
                slider.showTip(nx,slider.toRange(nx));
             };
          }
        );

   $(e).children(".slider_bar")
       .bind("click",
            function(evt){
               var offset = $(this).offset();
               var x = evt.pageX - offset.left, y = evt.pageY - offset.top;
               slider._moveTo(x,null);
               if ( slider.onDragEnd ){
                  slider.onDragEnd(slider.toRange(x));
               }
            })
       .bind("mousemove",
            function(evt){
               var offset = $(this).offset();
               var x = evt.pageX - offset.left, y = evt.pageY - offset.top;
               slider.showTip(x,slider.toRange(x));
            })
       .bind("mouseout",
            function(){
               slider.hideTip();
            });
            
   return this;
};
