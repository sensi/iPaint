//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : iPaintApp
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function debug(message,clear) {

   if (!debug.window_ || debug.window_.closed) {
       var win = window.open("", "_debug_window", "width=400,height=200," +
                             "scrollbars=yes,resizable=yes,status=no," +
                             "location=no,menubar=no,toolbar=no");
       if (!win){return;}
       var doc = win.document;
       doc.write("<html><head><title>Debug Log</title></head>" +
                  "<body style='font:10px arial;'></body></html>");
       doc.close();
       debug.window_ = win;
   }
   var logLine = debug.window_.document.createElement("div");
   logLine.appendChild(debug.window_.document.createTextNode(message));
   if ( clear ){
      debug.window_.document.body.innerHTML = "";
   }
   debug.window_.document.body.appendChild(logLine);

}

function iPaintApp(ipaint_frame,width, height,trackingCursorPosition,trackingObjectSize,trackingCanvasSize,fnActionComplete){
   
   
   this.winMgr     = new jsWindowManager(ipaint_frame);

   this.image_name = "Untitled";
   /**
    * Drawing unit, it can be 
    *   "px" for pixel, "cm" for centimeter, "in" for inch
    */
   this.unit = "px"; // unit
   /**
    * Canvas size
    */
   this.width = width || 400; this.height = height || 300;
   this.DPI  = 96;   // resolution
   
   this.RulerSize = 19;
   
   this.max_width = this.max_height = 4000;
   
   /**
    * Canvas history tracking
    */
   this.canvas_history   = new History(this);
      
   this._showRuler       = true;
   
   this._showGrid        = false;
   this.gridSize         = 10;
   
   this.trackableObject  = null;
   this.bucketObject     = null;
   this.ColorPicker      = null;
   
   this.imageProcessor   = new ImageProcessor();
   
   /**
    * Painting attribute. Changes to any of the values will affect all following painting
    */
   this.PaintingAttribute = {
      ForeColor            : {r:0,g:0,b:0,a:1.0},
      BackColor            : {r:255,g:255,b:255,a:1},
      Opacity              : 1.0,
      BackType             : "white",
      BackgroundSize       : 8,
      FillMode             : "solid",
      Outline              : "solid",
      LineWidth            : 1,
      LineWidthTreatment   : 0.5,
      LineJoin             : "bevel",
      LineCap              : "round",
      font                 : {size:"25px",name:"arial", textAlign:"start",textBaseline:"top",weight:"normal",style:"normal"}
   };
   
      
   this.containerID = ipaint_frame;
   var _this = this;
   $("#" + ipaint_frame + " #canvas_container").each(function(){_this.canvas_container = this;});

   //
   // setup textbox for entering text
   $("<textarea id=\"text_input\" style=\"visibility:hidden;padding:0px;margin:0px;background-color:rgba(255,255,255,0.4);\"></textarea>")
                  .bind("keydown",
                      function(event){
                         var left   = $(this).position().left;
                         var top    = $(this).position().top;
                         var width  = $(this).width();
                         var height = $(this).height();
                         _this.drawText($(this).val(),left,top,width,height);
                         this.old_value = $(this).val();
                      }
                  )
                  .bind("keyup",
                      function(event){
                         if ( $(this).val() !== this.old_value ){
                            var left   = $(this).position().left;
                            var top    = $(this).position().top;
                            var width  = $(this).width();
                            var height = $(this).height();
                            _this.drawText($(this).val(),left,top,width,height);
                         }
                      }
                  ).each(function(){_this.textBox = this;});
                     
   /**
    * Setup required elements hiraarchy within container
    */
   if ( $(this.canvas_container).children("[name=canvas]").size !== 1 ){
      $(this.canvas_container)
      .empty()
      .append("<div id=\"h_unit\">" + this.unit + "</div>")
      .append($("<div id=\"h_ruler_container\"></div>")
         .append("<canvas id=\"h_ruler\"   height=\"" + this.RulerSize + "\"></canvas>")
         .append("<canvas id=\"h_ruler_1\" height=\"" + this.RulerSize + "\"></canvas>")
         .append("<div    id=\"" + this.getID("h_spacer") + 
                 "\" class=\"drag_box canvas_drag_right\" style=\"height:" + this.RulerSize + "px;width:10px;visibility:hidden;\"></div>")
      )
      .append($("<div id=\"v_ruler_container\"></div>")
         .append("<canvas id=\"v_ruler\"   width=\"" + this.RulerSize + "\"></canvas>")
         .append("<canvas id=\"v_ruler_1\" width=\"" + this.RulerSize + "\"></canvas>")
         .append("<div    id=\"" + this.getID("v_spacer") + 
                             "\" class=\"drag_box canvas_drag_down\" style=\"width:" + this.RulerSize + "px;height:10px;visibility:hidden;\"></div>")
                             // height:10px is actually the size of canvas shadow to make sure that when scrolling happened,
                             // the scrollLeft/Top value will behave same between the ruler and the canvas.
      )
      .append(
         $("<div></div>").attr("id","inner_container").addClass("scroller")
         .css({
                  width:$(this.canvas_container).innerWidth() - this.RulerSize,
                  height:$(this.canvas_container).innerHeight() - this.RulerSize,
                  padding:0
              })
         .append("<canvas id=\"" + this.getID("canvas_bg")              + "\" width=\"" + this.width + "\" height=\"" + this.height + "\" class=\"canvas\"></canvas>")
         .append("<canvas id=\"" + this.getID("canvas_grid")            + "\" width=\"" + this.width + "\" height=\"" + this.height + "\" class=\"canvas_temp\"></canvas>")
         .append("<canvas id=\"" + this.getID("canvas")                 + "\" width=\"" + this.width + "\" height=\"" + this.height + "\" class=\"canvas\"></canvas>")
         .append("<canvas id=\"" + this.getID("canvas_temp1")           + "\" width=\"" + this.width + "\" height=\"" + this.height + "\" class=\"canvas_temp\"></canvas>")
         .append("<canvas id=\"" + this.getID("canvas_temp")            + "\" width=\"" + this.width + "\" height=\"" + this.height + "\" class=\"canvas_temp\"></canvas>")
         .append($(this.textBox)).each(function(){
            if ( !_this.isMobileDevice() ){
               $(this)
               .append("<div    id=\"" + _this.getID("canvas_drag_right")      + "\" class=\"drag_box canvas_drag_right\"></div>")
               .append("<div    id=\"" + _this.getID("canvas_drag_down")       + "\" class=\"drag_box canvas_drag_down\"></div>")
               .append("<div    id=\"" + _this.getID("canvas_drag_right_down") + "\" class=\"drag_box canvas_drag_right_down\"></div>");
            }
         })
         .append("<div id=\"focus_ring\"></div>")
         .append("<div id=\"drag_tl\" class=\"focus_ring_drag_box side_t side_l\"></div>")
         .append("<div id=\"drag_tm\" class=\"focus_ring_drag_box side_t side_h_m\"></div>")
         .append("<div id=\"drag_tr\" class=\"focus_ring_drag_box side_t side_r\"></div>")
         .append("<div id=\"drag_lm\" class=\"focus_ring_drag_box side_l side_v_m\"></div>")
         .append("<div id=\"drag_rm\" class=\"focus_ring_drag_box side_r side_v_m\"></div>")
         .append("<div id=\"drag_bl\" class=\"focus_ring_drag_box side_b side_l\"></div>")
         .append("<div id=\"drag_bm\" class=\"focus_ring_drag_box side_b side_h_m\"></div>")
         .append("<div id=\"drag_br\" class=\"focus_ring_drag_box side_b side_r\"></div>")
         .bind("scroll",
            function(){
               var sTop  = $(this).scrollTop(), 
                   sLeft = $(this).scrollLeft();
               $("#h_ruler_container").scrollLeft(sLeft);
               $("#v_ruler_container").scrollTop(sTop);
            })
      );
   }
   $("#status_bar .status_dimension .status_text").html(this.toUnit(this.width) + ", " + this.toUnit(this.height) + this.getUnit());
   

   /**
    * Get painting context. 
    */   

   this.canvas_bg      = document.getElementById(this.getID("canvas_bg"));
   this.canvas         = document.getElementById(this.getID("canvas"));
   this.canvas_draft   = document.getElementById(this.getID("canvas_temp"));
   this.canvas_draft1  = document.getElementById(this.getID("canvas_temp1"));
   this.canvas_grid    = document.getElementById(this.getID("canvas_grid"));   
   
   this.context_bg     = document.getElementById(this.getID("canvas_bg")).getContext("2d");
   this.context        = document.getElementById(this.getID("canvas")).getContext("2d");
   this.context_draft  = document.getElementById(this.getID("canvas_temp")).getContext("2d");
   this.context_draft1 = document.getElementById(this.getID("canvas_temp1")).getContext("2d");
   this.context_grid   = document.getElementById(this.getID("canvas_grid")).getContext("2d");
   
   this.trackingCursorPosition = function showCoord(canvas,x1,y1){
                                    var bRet = false;
		                              if ( typeof (trackingCursorPosition) === "function" ){
		                                 bRet = trackingCursorPosition(canvas,w,h);
		                              }
		                              if ( !bRet ){
                                       var s = x1 + ", " + y1 + canvas.getUnit();
                                       $("#status_bar .status_coord .status_text").html(s);
		                              }
		                           };
   this.trackingObjectSize     = function showSize(canvas,w,h){
		                              var bRet = false;
		                              if ( typeof (trackingObjectSize) === "function" ){
		                                 bRet = trackingObjectSize(canvas,w,h);
		                              }
		                              if ( !bRet ){
                                       var s = w + ", " + h + canvas.getUnit();
                                       $("#status_bar .status_select .status_text").html(s);
		                              }
		                           };
   this.trackingCanvasSize     = function(canvas,w,h){
                                    var bRet = false;
                                    if ( typeof (trackingCanvasSize) === "function" ){
                                       bRet = trackingCanvasSize(canvas,w,h);
                                    }
                                    if ( !bRet ){
                                       var s = w + ", " + h + canvas.getUnit();
                                       $("#status_bar .status_dimension .status_text").html(s);
                                    }
		                           };   
   this.fnActionComplete       = fnActionComplete ||
		                           function actionDown(canvas,oResult){
		                              //window.status = oResult.type + " done! Nodes: " + oResult.nodes.length;
		                           };

   this.registerEvents(this.max_width,this.max_height)
       .setupFrame({"toolbar":"dock"})
       .sizeTo(width,height);


   return this;
}

iPaintApp.prototype.setupFrame = function(oProp){
   var w = 0,h = 0;
   var margin = 5; // Same as defined in {body} element

   if ( !this.isMobileDevice() ){
      w = $(window).width() - margin * 2;
      h = $(window).height() - margin * 2;
      this.topMargin = 0;
   }else{
      if ( iOS ){
         w = $(window).width();
         h = $(window).height();
         this.topMargin = 21;
         // when in app mode, h direction, iPod touch return w=480, h = 300
         // when in app mode, v direction, iPod touch return w=320, h = 460

         // when in web mode, h direction, iPod touch return w=480, h = 208
         // when in web mode, v direction, iPod touch return w=320, h = 356
      }
   }
   //For testing app portrait mode in browser
   //w = 320; h = 460; this.topMargin = 21;
   //For testing app landscape mode in browser
   //w = 480; h = 300; this.topMargin = 21;
      
   var nToolbarHeight = $("#tool_bar").outerHeight();
   if ( oProp ){
      switch(oProp.toolbar){
      case "dock": 
         nToolbarHeight = $("#tool_bar")
                           .removeClass("shadow round_corner")
                           .css({position:"relative",cursor:"default"})
                           .animate({left:"0px",top:"-1px"},500)
                           .outerHeight();
         
         $("#tool_bar").attr({"toolbar":"dock"});
         Drag.detach(document.getElementById("tool_bar"));
         break;
      case "float": 
         $("#tool_bar")
         .css({position:"absolute",cursor:"move"})
         .animate({"left":50,"top":100},500)
         .addClass("round_corner shadow");
         
         nToolbarHeight = 0;
         Drag.init(document.getElementById("tool_bar"));
         $("#tool_bar").attr({"toolbar":"float"});
         break;
      default:
         nToolbarHeight = 0;
         $("#tool_bar").attr({"toolbar":"dock"});
         break;
      }
   }

   $("#ipaint_frame").css({width:(w-2)+"px",height:(h-2)+"px"});
   var hCanvas = $("#ipaint_frame").innerHeight() - 
                 $("#menu_bar").outerHeight() - 
                 nToolbarHeight - 
                 $("#status_bar").outerHeight();

   
   
   $("#canvas_container").css({height:hCanvas+"px"});

   $("#inner_container").css({
       width:($("#canvas_container").innerWidth() - this.RulerSize) + "px",
       height:($("#canvas_container").innerHeight() - this.RulerSize) + "px"
   });
   
   return this;
};

iPaintApp.prototype.getPaintAreaSize = function(){
   return {
      width:$("#inner_container").innerWidth(),
      height:$("#inner_container").innerHeight()
   };
};

/**
 * Methods for text input processing
 */
iPaintApp.prototype.positionTextbox = function(x,y,width,height,redraw){
   x += 8; y += 8;
   $("#text_input").css(
      {
         left   : x      + "px",
         top    : y      + "px",
         width  : width - 5  + "px",
         height : height - 5 + "px",
         visibility: "visible"
      }
   ).focus();
   
   if ( redraw ){
      var left   = $("#text_input").position().left;
      var top    = $("#text_input").position().top;
      width  = $("#text_input").width();
      height = $("#text_input").height();
      this.drawText(this.trackableObject.getShape().text(),
                     left,top,width,height);
   }else{
      $("#text_input").val("");
      this.trackableObject.getShape().text("");
   }
};

iPaintApp.prototype.hideTextbox = function(){
   $("#text_input").css({visibility: "hidden"});
};

iPaintApp.prototype.syncTextShape = function(height){
   if ( this.trackableObject && this.trackableObject instanceof TextObject ){
      this.trackableObject.getShape().maxY = this.trackableObject.getShape().minY + height + 5;
      this.trackableObject.showFocusRing(null);
   }
};

iPaintApp.prototype.drawText = function(str,left,top,width,height){
   if ( this.trackableObject && this.trackableObject instanceof TextObject ){
      this.trackableObject.getShape().text(str);
      this.context_draft.clearRect(0,0,this.width,this.height);
      this._drawText(str,left,top,width,height);
   }     
};
iPaintApp.prototype._drawText = function(str,left,top,width,height){
      var lineHeight = parseInt($("#text_input").css("lineHeight"),10);
      this.context_draft.save();
      this.context_draft.fillStyle = this.context_draft.strokeStyle;
      var t = top;
      var delta_w = 4;
      
      var arr = G_TextShape.fitText(this.context_draft,str,width-delta_w);
      
      var i;
      for ( i = 0; i < arr.length; i ++ ){
         var text = arr[i];
         var cur_height = lineHeight * (i + 1);
         if ( cur_height > height ){
            $("#text_input").css({height:cur_height + "px"});
            this.syncTextShape(cur_height);
         }
         this.context_draft.fillText(text,left-4,t-2);
         t += lineHeight;
      }
      
      this.context_draft.restore();
};

iPaintApp.prototype.reset = function(){
   if ( this.trackableObject ){
      if ( this.trackableObject.done ){
         this.trackableObject.done();
      }
      this.trackableObject.clearBoundingBox();
      this.trackableObject = null;
   }
   
   this.canvas_history.reset();
   this.sizeTo(this.width,this.height);
   return this;                           
};

iPaintApp.prototype.getID = function(id){
   return this.containerID + "_" + id;
};

iPaintApp.prototype._hex2dec = function(hex_str){
   hex_str = (hex_str+'').replace(/[^a-f0-9]/gi, '');
   return parseInt(hex_str, 16);
};

iPaintApp.prototype.colorStr = function(clr){
   return "rgba(" + clr.r + "," + clr.g + "," + clr.b + "," + clr.a + ")";
};

iPaintApp.prototype.opacity = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.Opacity;
   }else{
      this.PaintingAttribute.Opacity     = arguments[0];
      this.PaintingAttribute.ForeColor.a = arguments[0];
      this.PaintingAttribute.BackColor.a = arguments[0];
      this.context_draft.strokeStyle = "rgba(" + this.PaintingAttribute.ForeColor.r + "," + this.PaintingAttribute.ForeColor.g + "," + this.PaintingAttribute.ForeColor.b + "," + this.PaintingAttribute.ForeColor.a + ")";
      this.context_draft.fillStyle   = "rgba(" + this.PaintingAttribute.BackColor.r + "," + this.PaintingAttribute.BackColor.g + "," + this.PaintingAttribute.BackColor.b + "," + this.PaintingAttribute.BackColor.a + ")";
      
      if ( this.OpacitySlider ){
         this.OpacitySlider.setPosition(arguments[0] * 100);
      }
      
      this.canvas_history.add("Opacity",["opacity",arguments[0]].join("|"));
      return this;
   }
};

iPaintApp.prototype.foreColor = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.ForeColor;
   }else{
      if ( arguments.length === 1 ){
         var sColor = arguments[0];
         if ( typeof sColor === "object" ){
            this.PaintingAttribute.ForeColor = sColor;
         }
         if ( typeof sColor === "string" ){
            if ( sColor.length === 7 ){
               this.PaintingAttribute.ForeColor = {r: this._hex2dec(sColor.substr(1,2)),
                                                   g: this._hex2dec(sColor.substr(3,2)), 
                                                   b: this._hex2dec(sColor.substr(5,2)), 
                                                   a: this.PaintingAttribute.Opacity};
            }
         }
         var rgbaColor = "rgba(" + this.PaintingAttribute.ForeColor.r + "," + this.PaintingAttribute.ForeColor.g + "," + this.PaintingAttribute.ForeColor.b + "," + this.PaintingAttribute.ForeColor.a + ")";
         this.context_draft.strokeStyle = rgbaColor;

         $("#text_input").css({color:rgbaColor});
         $("#fore_color").css("backgroundColor",rgbaColor);
         
         this.canvas_history.add("Change Foreground",
                                 ["foreground",this.PaintingAttribute.ForeColor.r + "," + this.PaintingAttribute.ForeColor.g + "," + this.PaintingAttribute.ForeColor.b + "," + this.PaintingAttribute.ForeColor.a].join("|"));
      }
      return this;
   }
};

iPaintApp.prototype.backColor = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.BackColor;
   }else{
      if ( arguments.length === 1 ){
         var sColor = arguments[0];
         if ( typeof sColor === "object" ){
            this.PaintingAttribute.BackColor = sColor;
         }
         if ( typeof sColor === "string" ){
            if ( sColor.length === 7 ){
               this.PaintingAttribute.BackColor = {r: this._hex2dec(sColor.substr(1,2)),
                                                   g: this._hex2dec(sColor.substr(3,2)), 
                                                   b: this._hex2dec(sColor.substr(5,2)), 
                                                   a: 1.0};
            }
         }
         this.context_draft.fillStyle = "rgba(" + this.PaintingAttribute.BackColor.r + "," + this.PaintingAttribute.BackColor.g + "," + this.PaintingAttribute.BackColor.b + "," + this.PaintingAttribute.BackColor.a + ")";
         $("#back_color").css("backgroundColor",this.context_draft.fillStyle);
         this.canvas_history.add("Change Background",
                                 ["background",this.PaintingAttribute.BackColor.r + "," + this.PaintingAttribute.BackColor.g + "," + this.PaintingAttribute.BackColor.b + "," + this.PaintingAttribute.BackColor.a].join("|"));
      }
      return this;
   }
};

iPaintApp.prototype.lineWidth = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.LineWidth;
   }else{
      n = parseInt(arguments[0],10);
      this.PaintingAttribute.LineWidth = n;
      this.context_draft.lineWidth = this.PaintingAttribute.LineWidth;
      this.PaintingAttribute.LineWidthTreatment = ( (n % 2) === 0 ) ? 0 : 0.5;
      
      $("#tb_size .line-width").removeClass("selected");
      $("#tb_size [name='size_" + n + "px']").addClass("selected");
      $("#tb_size .input_line_width").val(n);
      
      this.canvas_history.add("Change Line Width",
                              ["linewidth",n].join("|"));
      return this;
   }
};
iPaintApp.prototype.fillMode = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.FillMode;
   }else{
      this.PaintingAttribute.FillMode = arguments[0];
      if ( this.trackableObject ){
         if ( this.trackableObject.setCanvas ){
            this.trackableObject.setCanvas(this);
         }
      }
      
      this.canvas_history.add("Fill Mode - " + arguments[0], ["fillmode",arguments[0]].join("|"));
      return this;
   }
};
iPaintApp.prototype.outline = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.Outline;
   }else{
      this.PaintingAttribute.Outline = arguments[0];
      if ( this.trackableObject ){
         if ( this.trackableObject.setCanvas ){
            this.trackableObject.setCanvas(this);
         }
      }
      this.canvas_history.add("Outline - " + arguments[0], ["outline",arguments[0]].join("|"));

      return this;
   }
};
iPaintApp.prototype.name = function(){
   if ( arguments.length === 0 ){
      return this.image_name;
   }else{
      this.image_name = arguments[0];
      return this;
   }
};

iPaintApp.prototype.canvasBackground = function(){
   if ( arguments.length === 0 ){
      switch(this.PaintingAttribute.BackType){
      case "white"      : return {r:255,g:255,b:255,a:1.0}; 
      case "gray"      : return {r:128,g:128,b:128,a:1.0}; 
      case "black"      : return {r:0,g:0,b:0,a:1.0}; 
      case "background" : return this.PaintingAttribute.BackColor; 
      case "transparent": return {r:0,g:0,b:0,a:0}; 
      }
   }else{
      sBack = arguments[0].toLowerCase();
      switch(sBack){
      case "white"      :
      case "gray"       :
      case "black"      :
      case "background" :
      case "transparent":
         this.PaintingAttribute.BackType = sBack;
         break;
      default:
         this.PaintingAttribute.BackType = "white";
         break;
      }
      this.drawCanvasBackground();
      this.canvas_history.add("Canvas Background", ["canvasbg",sBack].join("|"));
      
      $(".canvas_bg").removeClass("selected");
      $(".canvas_bg[name=\"" + sBack + "\"]").addClass("selected");
      return this;
   }
};

iPaintApp.prototype.setupFont = function(){
   this.context_draft.font = [this.PaintingAttribute.font.weight,
                              this.PaintingAttribute.font.style,
                              this.PaintingAttribute.font.size,
                              this.PaintingAttribute.font.name].join(" ");

   this.context_draft.textAlign = this.PaintingAttribute.font.textAlign;
   this.context_draft.textBaseline = this.PaintingAttribute.font.textBaseline;

   $("#text_input").css({
      fontSize:this.PaintingAttribute.font.size,
      fontFamily:this.PaintingAttribute.font.name,
      fontStyle:this.PaintingAttribute.font.style,
      fontBold:this.PaintingAttribute.font.bold
   });
};

iPaintApp.prototype.fontStyle = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.font.style;
   }else{
      this.PaintingAttribute.font.style = arguments[0];
      this.setupFont();
      this.canvas_history.add("Font Style Change",
                              ["fontstyle",this.PaintingAttribute.font.style].join("|"));
      
      return this;
   }
};

iPaintApp.prototype.fontWeight = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.font.weight;
   }else{
      this.PaintingAttribute.font.weight = arguments[0];
      this.setupFont();
      this.canvas_history.add("Font Weight Change",
                              ["fontweight",this.PaintingAttribute.font.weight].join("|"));
      
      return this;
   }
};

iPaintApp.prototype.fontName = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.font.name;
   }else{
      this.PaintingAttribute.font.name = arguments[0];
      this.setupFont();
      this.canvas_history.add("Font Name Change",
                              ["fontname",this.PaintingAttribute.font.name].join("|"));
      return this;
   }
};
iPaintApp.prototype.fontSize = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.font.name;
   }else{
      this.PaintingAttribute.font.size = arguments[0];
      this.setupFont();
      this.canvas_history.add("Font Size Change",
                              ["fontsize",this.PaintingAttribute.font.size].join("|"));
      
      return this;
   }
};



iPaintApp.prototype.font = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.font;
   }else{
      var arr = ["size","name","textAlign","textBaseline","weight","style"];
      var i;
      for ( i = 0; i < arguments.length; i ++ ){
          this.PaintingAttribute.font[arr[i]] = arguments[i];
      }
      this.setupFont();
      this.canvas_history.add("Font Change",
                              ["font",this.PaintingAttribute.font.size,this.PaintingAttribute.font.name].join("|"));
      
      return this;
   }
};

iPaintApp.prototype.lineCap = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.LineCap;
   }else{
      sCap = arguments[0].toLowerCase();
      
      if ( sCap === "butt" || sCap === "round" || sCap === "square" ){
         this.PaintingAttribute.LineCap = sCap;
         this.context_draft.lineCap = sCap;
         this.canvas_history.add("Line Cap",
                                 ["linecap",sCap].join("|"));
      }
      return this;
   }
};

iPaintApp.prototype.lineJoin = function(){
   if ( arguments.length === 0 ){
      return this.PaintingAttribute.LineJoin;
   }else{
      var sJoin = arguments[0].toLowerCase();
      
      if ( sJoin === "round" || sJoin === "bevel" || sJoin === "miter" ){
         this.PaintingAttribute.LineJoin = sJoin;
         this.context_draft.lineJoin = sJoin;
         this.canvas_history.add("Line Join",
                                 ["linejoin",sJoin].join("|"));
      }
      
      return this;
   }
};


iPaintApp.prototype.setOpacitySlider = function(s){
   if ( s instanceof jsSliderControl ){
      this.OpacitySlider = s;
   }
   return this;
};


iPaintApp.prototype.setColorPicker = function(s){
   if ( s instanceof jsColorPicker ){
      this.ColorPicker = s;
   }
   return this;
};
iPaintApp.prototype.getColorPicker = function(s){
   return this.ColorPicker;
};


iPaintApp.prototype.setUnit = function(unit){
   if ( this.unit === unit ){ return this;}
   this.unit = unit;
   if ( !this._showRuler ){ return this; }
   
   $("#h_unit").html(this.unit);
   this.updateRuler("forced");
   
   if ( this.trackingCanvasSize ){
      this.trackingCanvasSize(this,this.toUnit(this.width),this.toUnit(this.height));
   }
   return this;
};

iPaintApp.prototype.getUnit = function(){
   return this.unit;
};

iPaintApp.prototype._resetPaintingAttribute = function(){
   var bLog = false;
   if ( this.canvas_history.isLogging() ){
      this.canvas_history.stopLogging();
      bLog = true;
   }
   this.foreColor(this.PaintingAttribute.ForeColor)
       .backColor(this.PaintingAttribute.BackColor)
       .lineWidth(this.PaintingAttribute.LineWidth)
       .lineCap(this.PaintingAttribute.LineCap)
       .lineJoin(this.PaintingAttribute.LineJoin)
       .font(this.PaintingAttribute.font.size,this.PaintingAttribute.font.name,
             this.PaintingAttribute.font.textAlign,this.PaintingAttribute.font.textBaseline);
   
   if ( bLog ){
      this.canvas_history.startLogging();
   }
};

iPaintApp.prototype.size = function(){
   return {width:this.toUnit(this.width),
           height:this.toUnit(this.height)};
};
iPaintApp.prototype.sizeTo = function(w,h){
   
   var canvas_w = w || parseInt($("#" + this.getID("canvas")).attr("width"),10),
       canvas_h = h || parseInt($("#" + this.getID("canvas")).attr("height"),10);
   
   //canvas_w = this.toPixel(canvas_w); canvas_h = this.toPixel(canvas_h);    
   
   $("#" + this.getID("canvas_drag_right")).css({left:canvas_w + "px",top: Math.round((canvas_h-5)/2) + "px"});
   $("#" + this.getID("canvas_drag_down")).css({left:Math.round((canvas_w-5)/2) + "px",top:canvas_h + "px"});
   $("#" + this.getID("canvas_drag_right_down")).css({left:canvas_w + "px",top:canvas_h + "px"});
   
   $("#" + this.getID("h_spacer")).css({left:canvas_w + "px"});
   $("#" + this.getID("v_spacer")).css({top:canvas_h + "px"});

   var bRedrawBackground = false;
   if ( w ){
      $(this.canvas_bg)    .attr({width:canvas_w});
      $(this.canvas)       .attr({width:canvas_w});
      $(this.canvas_draft) .attr({width:canvas_w});
      $(this.canvas_draft1).attr({width:canvas_w});
      $(this.canvas_grid)  .attr({width:canvas_w});
      
      this.width = canvas_w;
      bRedrawBackground = true;
   }
   if ( h ){
      $(this.canvas_bg)    .attr({height:canvas_h});
      $(this.canvas)       .attr({height:canvas_h});
      $(this.canvas_draft) .attr({height:canvas_h});
      $(this.canvas_draft1).attr({height:canvas_h});
      $(this.canvas_grid)  .attr({height:canvas_h});
      
      this.height = canvas_h;
      bRedrawBackground = true;
   }
   if ( bRedrawBackground ){
      this._resetPaintingAttribute();
      this.updateRuler();
      this.drawCanvasBackground();
      if ( this._showGrid ){
         this.drawGrid();
      }
   }
   
   if ( this.trackingCanvasSize ){
      this.trackingCanvasSize(this,this.toUnit(this.width),this.toUnit(this.height));
   }
   return this;
};

iPaintApp.prototype.showGrid = function(flag){
   this._showGrid = flag;
   this.canvas_grid.style.display = ((flag) ? "" : "none");
   if ( this._showGrid ){
      this.drawGrid();
   }
};

iPaintApp.prototype.drawGrid = function(){
   this.context_grid.clearRect(0,0,this.width,this.height);
   this.context_grid.lineWidth    = 1;
   this.context_grid.strokeStyle  = "rgba(230,230,230,1)";
   
   this.context_grid.beginPath();
   var i;
   for ( i = this.gridSize; i < this.width; i += this.gridSize ){
       this.context_grid.moveTo(i+0.5,0.5);
       this.context_grid.lineTo(i+0.5,this.height+0.5);
   }
   for ( i = this.gridSize; i < this.height; i += this.gridSize ){
       this.context_grid.moveTo(0.5,i+0.5);
       this.context_grid.lineTo(this.width+0.5,i+0.5);
   }
   this.context_grid.stroke();
};

iPaintApp.prototype.drawCanvasBackground = function(){
   switch(this.PaintingAttribute.BackType){
   case "transparent":
   case "white"     : this.context_bg.fillStyle="rgba(255,255,255,1)"; break;
   case "gray"      : this.context_bg.fillStyle="rgba(128,128,128,1)"; break;
   case "black"     : this.context_bg.fillStyle="rgba(0,0,0,1)"; break;
   case "background": 
      this.context_bg.fillStyle = "rgba(" + this.PaintingAttribute.BackColor.r + "," +
                                            this.PaintingAttribute.BackColor.g + "," +
                                            this.PaintingAttribute.BackColor.b + "," +
                                            this.PaintingAttribute.BackColor.a + ")";
      break;
   }
   this.context_bg.fillRect(0,0,this.width,this.height);
   if ( this.PaintingAttribute.BackType === "transparent" ){
      this.context_bg.lineWidth = 1;
      this.context_bg.fillStyle="#cccccc";
      var row = 0,col = 0,i,j;
      for ( i = 0; i < this.width; i += this.PaintingAttribute.BackgroundSize, row ++ ){
         if ( row % 2 === 0 ){
            col = 0;
         }else{
            col = 1;
         }
         for ( j = 0; j < this.height; j += this.PaintingAttribute.BackgroundSize, col++ ){
            if ( (col % 2) !== 0 ){
               this.context_bg.fillRect(i,j,this.PaintingAttribute.BackgroundSize,this.PaintingAttribute.BackgroundSize);
            }
         }
         
      }
   }
};
		

iPaintApp.prototype.canvasUpdate = function(){
   this.context.drawImage(document.getElementById(this.getID("canvas_temp")), 0, 0);
   this.context_draft.clearRect(0, 0, this.width, this.height);		
};


iPaintApp.prototype.showStatus = function(){
};

/**
 * convert pixel value to specified unit value
 */
iPaintApp.prototype.toUnit = function(val,type){
   var one_inch = 2.54; // 1 inch = 2.54 cm
   if ( !type ){
      type = this.unit;
   }
   var n;
   switch(type){
   case "cm":
      n = (val / this.DPI) * one_inch;
      return n.toFixed(2);
   case "in":
      n = (val / this.DPI);
      return n.toFixed(2);
   case "px":
      return Math.round(val);
   }
};

iPaintApp.prototype.toPixel = function(val,type){
   var one_inch = 2.54; // 1 inch = 2.54 cm
   if ( !type ){
      type = this.unit;
   }
   var n;
   switch(type){
   case "cm":
      n = parseFloat(val) / one_inch * this.DPI;
      return n.toFixed(3);
   case "in":
      n = val * this.DPI;
      return n.toFixed(3);
   case "px":
      return val;   
   }
};

iPaintApp.prototype._treatWidth = function(v){
   return v + this.PaintingAttribute.LineWidthTreatment;
};

/**
 * Ruler control functions
 */ 
iPaintApp.prototype.showRuler = function(flag){
   if ( this._showRuler === flag ){return this;}
   
   $("#h_ruler_container").css("display",(flag ? "" : "none"));
   $("#v_ruler_container").css("display",(flag ? "" : "none"));
   $("#h_unit").css("display",(flag ? "" : "none")).html(this.unit);
   
   this._showRuler = flag;
   
   var w = $("#inner_container").width(),
       h = $("#inner_container").height();

   if ( flag ){
      $("#inner_container")
      .animate({
         left : this.RulerSize + "px",        top : this.RulerSize + this.topMargin + "px",
         width: w - this.RulerSize + "px", height : h - this.RulerSize + "px"
      },400);
      
      //this._setRulerSize().updateRuler("h").updateRuler("v");
      this.updateRuler();
      
   }else{       
      $("#inner_container")
      .animate({
         left:"0px",top:this.topMargin + "px",
         width: w + this.RulerSize + "px", height: h + this.RulerSize + "px"
      },400);
   }
   return this;
};

iPaintApp.prototype._updateRuler = function(s){
   if ( !this._showRuler ){ return this; }
   
   var ctx,i,x,y;
   var nStep  = 10,counter = 0, nWidth;
   if ( s === "h" ){
      ctx = document.getElementById("h_ruler").getContext("2d");
      ctx.clearRect(0,0,$("#h_ruler").width(),$("#h_ruler").height());
      ctx.strokeStyle = "#222222";
      ctx.font = "11px Arial";
      ctx.textAlign = "left";
      ctx.textBaseLine = "middle";
      ctx.lineWidth   = 1;
      
      if ( this.unit !== "px" ){
         nStep = parseFloat(this.toPixel(0.1,this.unit));
      }
      nWidth = Math.max($("#inner_container").innerWidth(),this.width);
      
      for ( i = 0.5; i < nWidth; i += nStep,counter ++){
         ctx.beginPath();
         x = Math.round(i) + 0.5;
         y = 13; 
         if ( counter % 10 === 0 ){
            if ( this.unit === "px" ){
               ctx.fillText(Math.floor(i),x+2,10);
            }else{
               ctx.fillText(counter/10,x+2,10);
            }
            y = 0;
         }else if ( counter % 5 === 0 ){
            y = 8;
         } 
         ctx.moveTo(x,y);
         ctx.lineTo(x,this.RulerSize);
         
         ctx.stroke();
      }
   }
   if ( s === "v" ){
      ctx = document.getElementById("v_ruler").getContext("2d");
      ctx.clearRect(0,0,$("#v_ruler").width(),$("#v_ruler").height());
      
      ctx.strokeStyle = "#222222";
      ctx.lineWidth   = 1;
      ctx.font = "11px Arial";
      ctx.textAlign = "left";
      ctx.textBaseLine = "bottom";
      
      if ( this.unit !== "px" ){
         nStep = parseFloat(this.toPixel(0.1,this.unit));
      }
      nWidth = Math.max($("#inner_container").innerHeight(),this.height);
      for ( i = 0.5; i < nWidth; i += nStep,counter ++){
         ctx.beginPath();
         y = Math.round(i) + 0.5; 
         x = 13; 
         
         if ( counter % 10 === 0 ){
            if( this.unit === "px" ){
               this._drawVerticalString(ctx,Math.floor(i),2,y+10);
            }else{
               this._drawVerticalString(ctx,counter/10,2,y+10);
            }
            x = 0;
         }else if ( counter % 5 === 0 ){
            x = 8;
         }  
         ctx.moveTo(x,y);
         ctx.lineTo(this.RulerSize,y);
         ctx.stroke();
      }
   }
//   debug("_updateRuler: " + s);
   return this;
};

iPaintApp.prototype._drawVerticalString = function(ctx,s,x,y){
   var i;
   for(i = 0; i < s.length; i ++ ){
      var c = s.charAt(i);
      ctx.fillText(c,x,y + (i*10));
   }
};

iPaintApp.prototype.trackingRuler = function(x,y){
   if ( !this._showRuler ){ return this; }
   
   var ctx_h = document.getElementById("h_ruler_1").getContext("2d");
   ctx_h.clearRect(0,0,parseInt($("#h_ruler").attr("width"),10),this.RulerSize);
      
   ctx_h.strokeStyle = "#ff0000";
   ctx_h.beginPath();
   ctx_h.moveTo(x+0.5,0.5); ctx_h.lineTo(x+0.5,this.RulerSize + 0.5);
   ctx_h.closePath();
   ctx_h.stroke();

   var ctx_v = document.getElementById("v_ruler_1").getContext("2d");
   ctx_v.clearRect(0,0,this.RulerSize,parseInt($("#v_ruler").attr("height"),10));
   
   ctx_v.strokeStyle = "#ff0000";
   ctx_v.beginPath();
   ctx_v.moveTo(0.5,y+0.5); ctx_v.lineTo(this.RulerSize + 0.5,y+0.5);
   ctx_v.closePath();
   ctx_v.stroke();
};

iPaintApp.prototype.updateRuler = function(update){
   if ( !this._showRuler ){ return this; }
   
   var w = Math.max($("#inner_container").innerWidth(),this.width);
   var h = Math.max($("#inner_container").innerHeight(),this.height);
   if ( !update ){
      update = "auto";
   }
   
   if ( w !== parseInt($("#h_ruler").attr("width"),10) || update === "forced"){
      $("#h_ruler_container").css({width:$("#inner_container").width()+"px"});
      $("#h_ruler").attr({width:w});
      $("#h_ruler_1").attr({width:w});
      this._updateRuler("h");
   }
   
   if ( h !== parseInt($("#v_ruler").attr("height"),10) || update === "forced" ){
      $("#v_ruler_container").css({height:$("#inner_container").height()+"px"});
      $("#v_ruler").attr({height:h});
      $("#v_ruler_1").attr({height:h});
      this._updateRuler("v");
   }
   return this;
};

iPaintApp.prototype.update = function(){
   if ( this.trackableObject ){
      if ( this.trackableObject.ObjectType === "trackable object" ){ 
         this.trackableObject.setCanvas(this);
         this.trackableObject.draw();
      }
   }
   return this;
};
iPaintApp.prototype.open = function(url,fnDone){
   var s  = document.domain.toLowerCase();
   var bIsRemote = (url.toLowerCase().indexOf(s) === -1);
   var _this = this;
   if ( bIsRemote ){
      $.getImageData({
         url:url,
         success:function(serverImage){
            _this.imageLoaded(url,serverImage,fnDone);
         },
         error:function(xhr,text_status){
            alert("Loading image failed!\n\n[" + url + "]<br/>Please verify the url is valid.");
         }
      });
   }else{
      var img = new Image();
      img.onload = function(){
         _this.imageLoaded(url,this,fnDone);
      };
      img.src = url;
   }
};
iPaintApp.prototype.imageLoaded = function(sUrl,img,fnDone){
   var _this = this;
   
   var s = sUrl.split("/");

   if ( _this.trackableObject ){
      if ( _this.trackableObject.done ){
         _this.trackableObject.done();
      }
      _this.trackableObject.clearBoundingBox();
      _this.trackableObject = null;
   }

   _this.sizeTo(img.width,img.height)
        .name(s[s.length-1]);
   _this.context.drawImage(img,0,0);
   _this.context_draft.drawImage(img,0,0);
   
   
   if ( fnDone ){
      fnDone();
   }else{
      _this.clearHistory();
      this.canvas_history.add("Open image","openimage|" + sUrl);
   }
   
};

iPaintApp.prototype.save = function(sFilename,sFormat,sUserID,fnOK){
   var sImageData = null, app = this;
   if ( !sFormat ){
      sFormat = "image/png";
   }
   
   if ( !sUserID ){
      sUserID = "guest";
   }

   this.context.drawImage(document.getElementById(this.getID("canvas_temp")), 0, 0);
   this.context_draft.clearRect(0, 0, this.width, this.height);	
   
   switch(this.PaintingAttribute.BackType){
   case "white"      :
   case "background" :
      this.context_draft.drawImage(document.getElementById(this.getID("canvas_bg")), 0, 0);
      this.context_draft.drawImage(document.getElementById(this.getID("canvas")), 0, 0);
      sImageData = document.getElementById(this.getID("canvas_temp")).toDataURL(sFormat);
      break;
   case "transparent":
      this.context_draft.drawImage(document.getElementById(this.getID("canvas")), 0, 0);
      sImageData = document.getElementById(this.getID("canvas_temp")).toDataURL(sFormat);
      break;
   }
   var ajaxData = {
      data:sImageData,
      file:sFilename,
      user:sUserID
   };   
   $.ajax({
      url:"/bundles/m3ipaint/iPaint/save_image.php",
      data:ajaxData,
      dataType:"json",
      type:"POST",
      cache:false,
      beforeSend:function(){},
      complete:function(){},
      success:function(data){
         if ( data ){
            if ( typeof(fnOK) === "function" ){
               fnOK(data.file);
            }
         }
         app.clearHistory();
      },
      error:function(s){
      }
   });
   
   return sImageData;
};

iPaintApp.prototype.share = function(arrEmail, sSender, sMsg, sUserID, fnOK){
   var sImageData = null;
   var sFormat = "image/png";
   var sFile   = "shared.png";
   if ( !sUserID ){
      sUserID = "guest";
   }

   this.context.drawImage(document.getElementById(this.getID("canvas_temp")), 0, 0);
   this.context_draft.clearRect(0, 0, this.width, this.height);	
   
   switch(this.PaintingAttribute.BackType){
   case "white"      :
   case "background" :
      this.context_draft.drawImage(document.getElementById(this.getID("canvas_bg")), 0, 0);
      this.context_draft.drawImage(document.getElementById(this.getID("canvas")), 0, 0);
      sImageData = document.getElementById(this.getID("canvas_temp")).toDataURL(sFormat);
      break;
   case "transparent":
      this.context_draft.drawImage(document.getElementById(this.getID("canvas")), 0, 0);
      sImageData = document.getElementById(this.getID("canvas_temp")).toDataURL(sFormat);
      break;
   }
   
   var ajaxData = {
      data    : sImageData,
      file    : sFile,
      sender  : sSender,
      msg     : sMsg,
      user    : sUserID,
      shareTo : arrEmail.join(";")
   };
      
   $.ajax({
      url:"./share_image.php",
      data:ajaxData,
      dataType:"json",
      type:"POST",
      cache:false,
      beforeSend:function(){},
      complete:function(){},
      success:function(data){
         if ( data ){
            if ( typeof(fnOK) === "function" ){
               fnOK(data.file);
            }
         }
      },
      error:function(s){
      }
   });
   
   return sImageData;
};


/**
 * Cut selected image from context and copied to context_draft. Replace original image
 * data with empty
 */
iPaintApp.prototype.cutRectImage = function(x,y,w,h){
   var oldImgData = this.context.getImageData(x,y,w,h);
   var emptyImgData = this.context_draft.getImageData(x,y,w,h);
   this.context.putImageData(emptyImgData,x,y);
   this.context_draft.putImageData(oldImgData,x,y);
   return oldImgData;
};

iPaintApp.prototype._makePath = function(context,shape){
   context.beginPath();
   context.moveTo(shape.firstNode().x,shape.firstNode().y);
   var i;
   for ( i = 1; i < shape.nodesCount(); i ++ ){
      context.lineTo(shape.getNode(i).x,shape.getNode(i).y);
   }
   context.lineTo(shape.firstNode().x,shape.firstNode().y);
   context.closePath();
};

iPaintApp.prototype.cutImage = function(shape){
   // Get selected image data from original context
   var contextImage = this.context.getImageData(shape.minX,shape.minY,shape.width(),shape.height());

   // store selected image data to a new created canvas
   var canvas = document.createElement("canvas");
   canvas.width = contextImage.width;canvas.height = contextImage.height;
   canvas.getContext("2d").putImageData(contextImage,0,0);
   
   // clear image from original context
   this._makePath(this.context,shape);
   this.context.save();
   this.context.clip();
   this.context.clearRect(shape.minX,shape.minY,shape.width(),shape.height());
   this.context.restore();
 
   // Copy selected image to draft
   this._makePath(this.context_draft,shape);
   this.context_draft.save();
   this.context_draft.clip();
   this.context_draft.drawImage(canvas,0,0,contextImage.width,contextImage.height,shape.minX,shape.minY,shape.width(),shape.height());
   this.context_draft.restore();
   
   // get selected imgData
   var imgData = this.context_draft.getImageData(shape.minX,shape.minY,shape.width(),shape.height());
   
   canvas = null;
   return imgData;
};


iPaintApp.prototype.crop = function(obj){
   var newW = obj.shape.width(),
       newH = obj.shape.height();

   this.sizeTo(newW,newH);
   this.context.putImageData(obj.shape.ImageData,0,0);
   obj.hideFocusRing();

   this.canvas_history.add("Crop",
                           ["cropimage",
                            obj.shape.toString("#")
                            ].join("|")
                           );

   obj = null;
};

iPaintApp.prototype.isMobileDevice = function(){
   var iPhone = navigator.userAgent.indexOf("iPhone") !== -1 ;
   var iPod   = navigator.userAgent.indexOf("iPod") !== -1 ;
   var iPad   = navigator.userAgent.indexOf("iPad") !== -1 ;
   var iOS    = iPhone || iPad || iPod ;
   //return true;
   return iOS;
};

iPaintApp.prototype.registerEvents = function(max_width,max_height){
   var canvas_w = parseInt($("#" + this.getID("canvas")).attr("width"),10),
       canvas_h = parseInt($("#" + this.getID("canvas")).attr("height"),10);

   var _this = this;
   this.old_image_data = null;
   
   if ( !_this.isMobileDevice() ){   
      var eDragRight     = document.getElementById(this.getID("canvas_drag_right"));
      var eDragDown      = document.getElementById(this.getID("canvas_drag_down"));
      var eDragRightDown = document.getElementById(this.getID("canvas_drag_right_down"));

      // setup event to monitor the width change
      //////////////////////////////////////////
      Drag.init(eDragRight,null,0,max_width,Math.round((canvas_h-5)/2),Math.round((canvas_h-5)/2));
      eDragRight.onDrag = function(evt,nx,ny){
         _this.sizeTo(nx);
         _this.context.drawImage(this.old_image,0,0);
      };
      eDragRight.onDragStart = function(){
         if ( _this.trackableObject && _this.trackableObject.done ){_this.trackableObject.done();}     
         var old_image_data = _this.context.getImageData(0,0,_this.width,_this.height);
         this.old_image = _this.createCanvas(old_image_data);
      }; 
      eDragRight.onDragEnd = function(){
         _this.context.drawImage(this.old_image,0,0);
         this.old_image = null;
         _this.canvas_history.add("Resize",["resize", _this.width + "," + _this.height].join("|"));
      };

      //
      // setup event to monitor the height change
      //////////////////////////////////////////
      Drag.init(eDragDown,null,Math.round((canvas_w-5)/2),Math.round((canvas_w-5)/2),0,max_height);
      
      eDragDown.onDrag = function(evt,nx,ny){
         _this.sizeTo(null,ny);
         _this.context.drawImage(this.old_image,0,0);
      };
      eDragDown.onDragStart = function(){
         if ( _this.trackableObject && _this.trackableObject.done ){_this.trackableObject.done();}     
         var old_image_data = _this.context.getImageData(0,0,_this.width,_this.height);
         this.old_image = _this.createCanvas(old_image_data);
      };
      eDragDown.onDragEnd = function(){
         _this.context.drawImage(this.old_image,0,0);
         this.old_image = null;
         _this.canvas_history.add("Resize",["resize", _this.width + "," + _this.height].join("|"));
      }; 
      
      
      //
      // setup event to monitor the width/height change
      //////////////////////////////////////////
      Drag.init(eDragRightDown,null,0,max_width,0,max_height);
      eDragRightDown.onDrag = function(evt,nx,ny){
         _this.sizeTo(nx,ny);
         _this.context.drawImage(this.old_image,0,0);
      };
      eDragRightDown.onDragStart = function(){
         if ( _this.trackableObject && _this.trackableObject.done ){_this.trackableObject.done();}     
         var old_image_data = _this.context.getImageData(0,0,_this.width,_this.height);
         this.old_image = _this.createCanvas(old_image_data);
      };
      eDragRightDown.onDragEnd = function(){
         _this.context.drawImage(this.old_image,0,0);
         this.old_image = null;
         _this.canvas_history.add("Resize",["resize", _this.width + "," + _this.height].join("|"));
      }; 
   }
      
   var eCanvas = document.getElementById(this.getID("canvas_temp"));
   eCanvas.app = this;
   $(eCanvas).data("app",this)
      .bind("mousedown",
            function(event){
               if ( typeof(hidePoppedTool) === "function" ){
                  hidePoppedTool(); // Function from ipaint.html
               }
               
               var x = event.pageX - $(this).offset().left,y = event.pageY - $(this).offset().top;
               $(this).data("app").mouseDown(event, x, y);
            })
      .bind("mousemove",
            function(event){
               var x = event.pageX - $(this).offset().left,y = event.pageY - $(this).offset().top;
               $(this).data("app").mouseMove(event, x, y);
            })
      .bind("mouseup",
            function(event){
               var x = event.pageX - $(this).offset().left,
                   y = event.pageY - $(this).offset().top;
               $(this).data("app").mouseUp(event, x, y);
            })
      .bind("dblclick",
            function(event){
               var x = event.pageX - $(this).offset().left,
                   y = event.pageY - $(this).offset().top;
               $(this).data("app").doubleClick(event,x,y);                   
            });
   // iPhone/iPod Touch/iPad support
   if ( typeof(iOS) !== "undefined" && iOS ){
      this.actionTimer = null;
      $(eCanvas)
        .bind("touchstart",function(event){
            event.preventDefault();  
            var orgEvent = event.originalEvent; 
            var x = orgEvent.changedTouches[0].pageX - $(this).offset().left,y = orgEvent.changedTouches[0].pageY - $(this).offset().top;
            $(this).data("app").mouseDown(event, x, y);
        })               
        .bind("touchmove",function(event){
            event.preventDefault();  
            var orgEvent = event.originalEvent; 
            var x = orgEvent.changedTouches[0].pageX - $(this).offset().left,y = orgEvent.changedTouches[0].pageY - $(this).offset().top;
            $(this).data("app").mouseMove(event, x, y);
        })               
        .bind("touchend",function(event){
            event.preventDefault();
            var orgEvent = event.originalEvent; 
            var x = orgEvent.changedTouches[0].pageX - $(this).offset().left,
                y = orgEvent.changedTouches[0].pageY - $(this).offset().top;

            var now = new Date().getTime();
            var lastTouch = $(this).data("lastTouch") ||  now + 1;
            var delta = now - lastTouch;
            if ( $(this).data("app").actionTimer ){
               clearTimeout($(this).data("app").actionTimer);
               $(this).data("app").actionTimer = null;
            }
            if ( delta > 0 && delta < 500 ){
               $(this).data("app").doubleClick(event, x, y);
            }else{
               $(this).data("app").actionTimer = window.setTimeout(function(para){
                  var event = para[0], x = para[1], y = para[2], app = para[3];
                  app.mouseUp(event, x, y);
                  window.clearTimeout(app.actionTimer);
                  app.actionTimer = null;
               },500,[event,x,y,$(this).data("app")]);
            }
            $(this).data("lastTouch",now);
        });
   }
   
   return this;
};
iPaintApp.prototype.mouseDown = function(event,x,y){
   if ( this.trackableObject ){

      if ( this.trackableObject.ObjectType === "brush" ){
         this.trackableObject.strokeStart(x,y);
         
      }else{
      
         if ( this.trackableObject.completed() ){
            this.trackableObject.done();
         }
         
         if ( this.bucketObject ){
            this.bucketObject.mouseDown(event,x,y);
         }else{
            this.trackableObject.mouseDown(event,x,y);
         }
         
      }
   }else{
      if ( this.bucketObject ){
         this.bucketObject.mouseDown(event,x,y);
      }
   }
};

iPaintApp.prototype.mouseMove = function(event,x,y){
   this.trackingRuler(x,y);

   if ( this.trackingCursorPosition ){
      this.trackingCursorPosition(this,this.toUnit(x),this.toUnit(y));
   }

   if ( this.trackableObject ){
      if ( this.trackableObject.ObjectType === "brush" ){
         this.trackableObject.stroke(x,y);
      }else{
         if ( this.bucketObject ){
            this.bucketObject.mouseMove(event,x,y);
         }else{
            this.trackableObject.mouseMove(event,x,y);
         }
         this.trackingObjectSize(this,this.toUnit(this.trackableObject.getShape().width()),this.toUnit(this.trackableObject.getShape().height()));
      }
   }else{
      if ( this.bucketObject ){
         this.bucketObject.mouseMove(event,x,y);
      }
   }
};


iPaintApp.prototype.mouseUp = function(event,x,y){
   if ( this.trackableObject ){
      if ( this.trackableObject.ObjectType === "brush" ){
         this.trackableObject.strokeEnd();
      }else{
         if ( this.bucketObject ){
            this.bucketObject.mouseUp(event,x,y);    
         }else{
            this.trackableObject.mouseUp(event,x,y);    
         }
      }
   }else{
      if ( this.bucketObject ){
         this.bucketObject.mouseUp(event,x,y);    
      }
   }
};

iPaintApp.prototype.doubleClick = function(event,x,y){
   if ( this.trackableObject ){
      if ( this.trackableObject.ObjectType !== "brush" ){
         this.trackableObject.dblclick(event,x,y);    
      }
   }
};
iPaintApp.prototype.getAction = function(){return this.currentAction;};
iPaintApp.prototype.setAction = function(sType){
   this.actionStart = false;
   this.actionNodes = [];
   
   this.currentAction = sType;
   
   if ( sType === "none" ){
      $("#" + this.getID("canvas_temp")).css({"cursor":"url(style/pencil.png) 4 12, default"}); 
   }else{
      $("#" + this.getID("canvas_temp")).css({"cursor":"crosshair"}); 
   }
   
   switch(sType){
   case "cut":
      if ( this.trackableObject ){
         this.trackableObject.cut();
         this.trackableObject.clearBoundingBox();
      }
      this.trackableObject = null;
      if (typeof(disableIcon) === "function" ){
         disableIcon("tool_crop","tool_resize","tool_rotate","tool_cut");
      }
      return;
   case "crop":
      if ( this.trackableObject && this.trackableObject.type === "selection" ){
         this.crop(this.trackableObject);
      }
      return;
   case "resize": 
      if ( this.trackableObject && (this.trackableObject.type === "shape"||this.trackableObject.type === "selection")  ){
         //this.showResizeDialog(this.trackableObject);
         this.openResizeDialog();
         return;
      }
      break;
   case "rotate": 
      if ( this.trackableObject && (this.trackableObject.type === "shape"||this.trackableObject.type === "selection")  ){
         //this.showRotateDialog(this.trackableObject);
         this.openRotateDialog();
         return;
      }
      break;
   case "bucket_solid":          
   case "bucket_linear_grad":
   case "bucket_radial_grad":
   case "bucket_reflected_grad":
   case "bucket_diamond_grad":
      if ( this.trackableObject ){
         if ( this.trackableObject.done ){
            this.trackableObject.done();
         }
         if ( this.trackableObject.shape && this.trackableObject.shape.isClosedShape() ){
            this.trackableObject.showBoundingBox();
         }else{
            this.trackableObject = null;
         }
      }
      break;
   default:
      if ( this.trackableObject ){
         if ( this.trackableObject.done ){
            this.trackableObject.done();
         }
         this.trackableObject.clearBoundingBox();
         this.trackableObject = null;
      }
      this.bucketObject = null;
      break;
   }
   
   switch(sType){
   case "line"                        : this.trackableObject = new LineObject(); break;
   case "curve"                       : this.trackableObject = new BezierCurveObject(); break;
   case "rectangle"                   : this.trackableObject = new RectangleObject(); break;
   case "rounded_rectangle"           : this.trackableObject = new RoundedRectangleObject(); break;
   case "oval"                        : this.trackableObject = new OvalObject(); break;
   
   case "polyline"                    : this.trackableObject = new PolylineObject(); break;
   case "polygon"                     : this.trackableObject = new PolygonObject(); break;
   
   case "cardinal_spline"             : this.trackableObject = new CardinalSplineObject(); break;
   case "closed_cardinal_spline"      : this.trackableObject = new ClosedCardinalSplineObject(); break;

   case "triangle"                    : this.trackableObject = new RightPolygonObject(3); break;
   case "diamond"                     : this.trackableObject = new RightPolygonObject(4); break;
   case "pentagon"                    : this.trackableObject = new RightPolygonObject(5); break;
   case "hexagon"                     : this.trackableObject = new RightPolygonObject(6); break;
   
   case "left_arrow"                  : this.trackableObject = new ArrowObject("left"); break;
   case "right_arrow"                 : this.trackableObject = new ArrowObject("right"); break;
   case "up_arrow"                    : this.trackableObject = new ArrowObject("up"); break;
   case "down_arrow"                  : this.trackableObject = new ArrowObject("down"); break;
   

   case "four_point_star"             : this.trackableObject = new MultipointStarObject(4); break;
   case "five_point_star"             : this.trackableObject = new MultipointStarObject(5); break;
   case "six_point_star"              : this.trackableObject = new MultipointStarObject(6); break;
   case "rounded_rectangular_callout" : this.trackableObject = new RoundedRectangularCalloutObject(); break;
   case "heart"                       : this.trackableObject = new HeartObject(); break;
   

   case "pencil"                      : this.trackableObject = new PencilObject(); break;   
   case "font"                        : this.trackableObject = new TextObject(); break;   
   case "eye_dropper"                 : this.trackableObject = new EyeDropperObject();break;
   case "eraser"                      : this.trackableObject = new EraserObject();break;
   
   case "simple_brush"                : this.trackableObject = new SimpleBrush().init(this);break;
   case "ribbon_brush"                : this.trackableObject = new RibbonBrush().init(this);break;
   case "hair_brush"                  : this.trackableObject = new HairBrush().init(this);break;
   case "long_hair_brush"             : this.trackableObject = new LongHairBrush().init(this);break;
   case "square_brush"                : this.trackableObject = new ShapeBrush().init(this);break;
        
   case "select_box"                  : this.trackableObject = new RectangularSelectionObject();break;
   case "select_polygon"              : this.trackableObject = new PolygonSelectionObject();break;
   case "select_all"                  : break;
   
   case "crop"                        : this.trackableObject = new EraserObject();break;
   case "resize"                      : break;
   case "rotate"                      : break;
   
   case "bucket_solid"                : this.bucketObject = new PaintBucketObject(this.trackableObject,"Solid");break;
   case "bucket_linear_grad"          : this.bucketObject = new PaintBucketObject(this.trackableObject,"Linear");break;
   case "bucket_radial_grad"          : this.bucketObject = new PaintBucketObject(this.trackableObject,"Radial");break;
   case "bucket_reflected_grad"       : this.bucketObject = new PaintBucketObject(this.trackableObject,"Reflected");break;
   case "bucket_diamond_grad"         : this.bucketObject = new PaintBucketObject(this.trackableObject,"Diamond");break;
   
   case "zoom_glass"                  : this.trackableObject = new ZoomGlassObject(this.trackableObject,"Diamond");break;
   }
   
   if ( this.bucketObject ){
      this.bucketObject.init(this);
   }
   if ( this.trackableObject ){
      if ( this.trackableObject.ObjectType !== "brush" ){

         this.trackableObject.onHelp = function(msg){
            $("#status_bar .status_prompt").html(msg);
         };
         
         if ( !this.bucketObject ){
            this.trackableObject.init(this);
            
            if ( this.trackableObject.type === "shape" ){
               this.trackableObject.onCompleted = 
                  function(obj){
                     if ( obj.isDirty() ){
                        if (typeof(enableIcon) === "function" ){
                           enableIcon("tool_resize","tool_rotate","tool_cut");
                        }
                     }
                  };
               this.trackableObject.onDone = 
                  function(obj){
                     if (typeof(disableIcon) === "function" ){
                        disableIcon("tool_resize","tool_rotate","tool_cut");
                     }
                  };
            }else if ( this.trackableObject.type === "selection" ){
               this.trackableObject.onCompleted = 
                  function(obj){
                     if (typeof(enableIcon) === "function" ){
                        enableIcon("tool_crop","tool_resize","tool_rotate","tool_cut");
                     }
                  };
               this.trackableObject.onDone = 
                  function(obj){
                     if (typeof(disableIcon) === "function" ){
                        disableIcon("tool_crop","tool_resize","tool_rotate","tool_cut");
                     }
                  };
            }
         }
      }      
   }
   return this;
};

iPaintApp.prototype.clearHistory = function(){
   if ( supports_storage() ){
      window.localStorage.clear();
   }
   this.canvas_history.reset();
};
iPaintApp.prototype.showHistory = function(){
   if ( supports_storage() ){
      var base_attr = window.localStorage.getItem("baseattr");
      var nTotalEntry = window.localStorage.getItem("totalentry");
      if ( nTotalEntry ){
         nTotalEntry = parseInt(nTotalEntry,10);
      }else{
         nTotalEntry = 0;
      }
      debug("baseattr = " + base_attr,true);
      debug("totalentry = " + nTotalEntry);
      var i;
      for ( i = 0; i < nTotalEntry; i ++ ){
         var s = window.localStorage.getItem("hist_" + i);
         debug("hist_" + i + " = " + s);
      }
   }
};
iPaintApp.prototype.storeHistory = function(){
   this.canvas_history.discardDisabled();
};

iPaintApp.prototype.restoreHistoryTo = function(toIndex){
   if ( supports_storage() ){
      var base_attr = window.localStorage.getItem("baseattr");
      if ( base_attr ){
         this.setAttributeString(base_attr);
      }
      // check if the first entry is openimage
      this.canvas_history.stopLogging();
      var s = window.localStorage.getItem("hist_0");
      var arr = s.split("@")[1].split("|");
      if ( arr[0] === "openimage" ){
         var app = this;
         this.open(arr[1],
            function(){
               app.restoreHistoryRange(1,toIndex,false);
               app.canvas_history.startLogging();
            }
         );
      }else{
         this.restoreHistoryRange(0,toIndex,false);
         this.canvas_history.startLogging();
      }
   }      
};

iPaintApp.prototype.restoreHistory = function(){
   if ( supports_storage() ){
      this.canvas_history.stopLogging();
      var base_attr = window.localStorage.getItem("baseattr");
      if ( base_attr ){
         this.setAttributeString(base_attr);
      }
      var nTotal = this.canvas_history.getNumOfEntries();
      
      if ( nTotal > 0 ){
         // check if the first entry is openimage
         var s = window.localStorage.getItem("hist_0");
         try{
            var arr = s.split("@")[1].split("|");
            if ( arr[0] === "openimage" ){
               var app = this;
               this.open(arr[1],
                  function(){
                     app.restoreHistoryRange(1,nTotal,true);
                     app.canvas_history.startLogging();
                  }
               );
            }else{
               this.restoreHistoryRange(0,nTotal,true);
               this.canvas_history.startLogging();
            }
         }catch(e){}
      }else{
         this.canvas_history.startLogging();
      }
   }
};

iPaintApp.prototype.restoreHistoryRange = function(start,nTotal,bResetPart){
   var key,i;
   for ( i = start; i < nTotal; i ++ ){
      key = "hist_" + i;
      try{
         var s = window.localStorage.getItem(key);
         this.restoreStorage(s);
      }catch(e){}
   }
   this.context.drawImage(this.canvas_draft,0,0);
   this.context_draft.clearRect(0,0,this.width,this.height);
};

iPaintApp.prototype.checkOfflineStorage = function(){
   return this;
};
iPaintApp.prototype.restoreStorage = function(s){
   s   = s.split("@")[1];
   var arr = s.split("|"), arrColor,loc;
   var sType = arr[0];
   switch(sType){
   case "New":
      var unit = arr[1], size = arr[2].split(","), name = arr[3];
      var w = this.toPixel(parseInt(size[0],10),unit),
          h = this.toPixel(parseInt(size[1],10),unit);
      this.canvas_history.stopLogging();
      this.sizeTo(w,h).name(name).setUnit(unit)
          .reset();   
      this.canvas_history.startLogging();
      break;
   case "openimage":
      var sURL = arr[1];
      this.open(sURL);
      break;
   case "foreground":
      arrColor = arr[1].split(",");
      this.foreColor({r:parseInt(arrColor[0],10),g:parseInt(arrColor[1],10),b:parseInt(arrColor[2],10),a:parseFloat(arrColor[3])});
      break;
   case "background":
      arrColor = arr[1].split(",");
      this.backColor({r:parseInt(arrColor[0],10),g:parseInt(arrColor[1],10),b:parseInt(arrColor[2],10),a:parseFloat(arrColor[3])});
      break;
   case "canvasbg"  : this.canvasBackground(arr[1]);break;
   case "opacity"   : this.opacity(parseFloat(arr[1]));break;
   case "linewidth" : this.lineWidth(parseInt(arr[1],10));break;
   case "linejoin"  : this.lineJoin(arr[1]);break;
   case "linecap"   : this.lineCap(arr[1]);break;
   case "fillmode"  : this.fillMode(arr[1]);break;
   case "outline"   : this.outline(arr[1]);break;
   case "fontname"  : this.fontName(arr[1]);break;
   case "fontsize"  : this.fontSize(arr[1]);break;
   case "fontweight": this.fontWeight(arr[1]);break;
   case "fontstyle" : this.fontStyle(arr[1]);break;
   case "font"      : this.font([arr[1], arr[2],"start"/*textAlign*/,"top"/*textBaseline*/]);break;
   case "solidfill":
      loc = arr[1].split(",");
      var seedColor = arr[2].split(","), oldColor = arr[3].split(",");
      new PaintBucketObject(null,"Solid").init(this)
         .solidPaint(this.context_draft, parseInt(loc[0],10),parseInt(loc[1],10),
                     {r:parseInt(seedColor[0],10),g:parseInt(seedColor[1],10),b:parseInt(seedColor[2],10),a:parseFloat(seedColor[3])},
                     {r:parseInt(oldColor[0],10),g:parseInt(oldColor[1],10),b:parseInt(oldColor[2],10),a:parseFloat(oldColor[3])});
      break;
   case "gradientfill":
      var type = arr[1], line = arr[2], foreColor = arr[3].split(","), backColor = arr[4].split(",");
      var target = arr[5];
      var oLine = new G_Line().deserialize(line,"~");
      var fore = {r:parseInt(foreColor[0],10),g:parseInt(foreColor[1],10),b:parseInt(foreColor[2],10),a:parseFloat(foreColor[3])},
          back = {r:parseInt(backColor[0],10),g:parseInt(backColor[1],10),b:parseInt(backColor[2],10),a:parseFloat(backColor[3])};
      var dstShape = null;
      if ( target !== "" ){
         dstShape = G_Shape.getShape(target,"~");
      }
      new PaintBucketObject(null,type).init(this)
         .gradientPaint(type,oLine,fore,back,dstShape);
      break;   
   case "simplebrush":      
      new SimpleBrush().init(this).deserialize(s);
      break;
   case "ribbonbrush":      
      new RibbonBrush().init(this).deserialize(s);
      break;
   case "hairbrush":      
      new HairBrush().init(this).deserialize(s);
      break;
   case "longhairbrush":      
      new LongHairBrush().init(this).deserialize(s);
      break;
   case "shapebrush":      
      new ShapeBrush().init(this).deserialize(s);
      break;
   case "Text":
      var loc = arr[2].split(","), str = arr[3];
      var left = parseInt(loc[0],10) + 5, top = parseInt(loc[1],10) + 5,
          width = parseInt(loc[2],10), height = parseInt(loc[3],10);
      $("#text_input").offset();
      this._drawText(str,left,top,width,height);
      break;      
   case "cutselection":
      var s = arr[1].replace(/Selection/g,"Polygon");
      var shape = G_Shape.getShape(s,"#");
      shape.makePath({context:this.context_draft,lineTreatment:this.PaintingAttribute.LineWidthTreatment});
      this.context_draft.save();
      this.context_draft.clip();
      this.context_draft.clearRect(shape.minX,shape.minY,shape.width(),shape.height());
      this.context_draft.restore();
      break;
   case "freetransform":
      var shapes = arr[1].split("~");
      var clearBack = shapes[0].charAt(shapes[0].length - 1);
      var from = shapes[0].substr(0,shapes[0].length - 1).replace(/Selection/g,"Polygon");
      var to   = shapes[1].replace(/Selection/g,"Polygon");
      from = G_Shape.getShape(from,"#"); to = G_Shape.getShape(to,"#");
      this.transform(from,to,clearBack);
      break;
   case "cropimage":
      var s = arr[1].replace(/Selection/g,"Polygon");
      var shape = G_Shape.getShape(s,"#");
      var imgData = this.context_draft.getImageData(shape.minX,shape.minY,shape.width(),shape.height());
      shape.move(-shape.minX,-shape.minY);
      var canvas = this.createCanvas(imgData);
      this.sizeTo(shape.width(),shape.height());
      this.context_draft.clearRect(0,0,shape.width(),shape.height());
      
      this.context_draft.save();
      shape.makePath({context:this.context_draft,lineTreatment:this.PaintingAttribute.LineWidthTreatment});
      this.context_draft.clip();
      this.context_draft.drawImage(canvas,0,0);
      this.context_draft.restore();
      break;
   case "resize":
      var a = arr[1].split(",");
      var w = parseInt(a[0],10), h = parseInt(a[1],10);
      var oldImg = this.context_draft.getImageData(0,0,this.width,this.height);
      var canvas = this.createCanvas(oldImg);
      this.sizeTo(w,h);
      this.context_draft.drawImage(canvas,0,0);
      break;
   case "Eraser":
      var eraser = new EraserObject().deserialize(s,"|",this.context_draft);break;
   default:
      var ctx = {
                       context       : this.context_draft,
                       outline       : this.outline(),
                       fill          : this.fillMode(),
                       lineTreatment : this.PaintingAttribute.LineWidthTreatment
                    };
   
      s = G_Shape.drawShape(ctx,s);
      break;
   }
   return true;
};
iPaintApp.prototype.transform = function(shape1,shape2,clear){
   var imgData = this.context_draft.getImageData(shape1.minX,shape1.minY,shape1.width(),shape1.height());
   var canvas = document.createElement("canvas");
   canvas.width = shape1.width(); canvas.height = shape1.height(); 
   canvas.getContext("2d").putImageData(imgData,0,0);
   
   if ( clear === "1" ){ // clear original areal surrounded by shape1
      this.context_draft.save();
      shape1.makePath({context:this.context_draft,lineTreatment:this.PaintingAttribute.LineWidthTreatment});
      this.context_draft.clip();
      this.context_draft.clearRect(shape1.minX,shape1.minY,shape1.width(),shape1.height());
      this.context_draft.restore();
   }
   
   this.context_draft.save();
   shape2.makePath({context:this.context_draft,lineTreatment:this.PaintingAttribute.LineWidthTreatment});
   this.context_draft.clip();
   this.context_draft.drawImage(canvas,0,0,canvas.width,canvas.height,
                                shape2.minX,shape2.minY,shape2.width(),shape2.height());
   this.context_draft.restore();
   
};
iPaintApp.prototype.clearImage = function(){
   this.context.clearRect(0,0,this.width,this.height);
   this.context_draft.clearRect(0,0,this.width,this.height);
   this.context_draft1.clearRect(0,0,this.width,this.height);
   this.clearHistory();
};


iPaintApp.prototype.newImage = function(oProp){
   var w = this.toPixel(oProp.image_width,oProp.image_unit_w),
       h = this.toPixel(oProp.image_height,oProp.image_unit_h);
   
   this.DPI = oProp.image_resolution;
        
   this.sizeTo(w,h)
       .name(oProp.image_name)
       .setUnit(oProp.image_unit_w)
       .canvasBackground(oProp.image_bg)
       .reset();
   return this;       
};
iPaintApp.prototype.openNewImageDialog = function(w,h){
   var app = this;
   return new jsWindow(this.winMgr)
      .createDialog("new_image","New Image ...",350,310)
      .load("/bundles/m3ipaint/iPaint/dialog/new-image.html",
            function(jWin,sHTML){
               var oFormInitValue = 
                              {
                                 image_name      : "Untitled",
                                 image_width     : w || "600",
                                 image_height    : h || "400",
                                 image_unit_w    : "px",
                                 image_resolution: "96",
                                 image_unit_h    : "px",
                                 image_bg        : "white",
                                 BtnOK           : function(jwin){
                                                      var oData = jwin.getFormData();
                                                      oData.image_width = parseInt(oData.image_width,10);
                                                      oData.image_height = parseInt(oData.image_height,10);
                                                      oData.image_resolution = parseInt(oData.image_resolution,10);
                                                      jwin.close("OK"); 
                                                      app.newImage(oData);
                                                      app.clearHistory();
                                                   },
                                 BtnCancel       : function(jwin){
                                                      jwin.close("Cancel"); 
                                                   }
                              };
               jWin.setFormData(oFormInitValue);
            }
       );
};

iPaintApp.prototype.openSaveImageDialog = function(){
   var app = this;
   return new jsWindow(this.winMgr)
      .createDialog("save_image","Save Image ...",310,190)
      .load("/bundles/m3ipaint/iPaint/dialog/save-image.html",
            function(jWin,sHTML){
               var oFormInitValue = 
                              {
                                 image_file      : app.name() + ".png",
                                 image_format    : "png",
                                 BtnOK           : function(jwin){
                                                      var oData = jwin.getFormData();
                                                      jwin.close("OK"); 
                                                      var ext = oData.image_format;
                                                      var file = oData.image_file;
                                                      if ( file.indexOf(".") === -1 ){
                                                         file += "." + ext;
                                                      }else{
                                                         var arr = file.split(".");
                                                         arr[arr.length-1] = ext;
                                                         file = arr.join(".");
                                                      }
                                                      app.save(file,"image/" + ext,null,function onOK(url){});
                                                   },
                                 BtnCancel       : function(jwin){
                                                      jwin.close("Cancel"); 
                                                   }
                              };
               jWin.setFormData(oFormInitValue);
               if ( dialog ){
                  dialog.init();
               }
            }
       );
};

iPaintApp.prototype.openShareImageDialog = function(){
   var sEmails = "", sSender = "";
   if ( supports_storage() ){
      sEmails = window.localStorage.getItem("email_list") || "";
      sSender = window.localStorage.getItem("sender") || "";
   }
   var app = this;
   return new jsWindow(this.winMgr)
      .createDialog("share_image","Share Image ...",310,300)
      .load("/bundles/m3ipaint/iPaint/dialog/share-image.html",
            function(jWin,sHTML){
               var oFormInitValue = 
                              {
                                 email_list      : sEmails,
                                 sender_name     : sSender,
                                 email_body      : "",
                                 BtnOK           : function(jwin){
                                                      var oData = jwin.getFormData();
                                                      if ( dialog ){
                                                         var arrEmail = dialog.validate();
                                                         if ( arrEmail  ){
                                                            var oData = jwin.getFormData();
                                                            jwin.close("OK"); 
                                                            alert(arrEmail + "\n" + oData.sender_name + "\n" + oData.email_body);
                                                            if ( supports_storage() ){
                                                               window.localStorage.setItem("email_list",arrEmail.join(","));
                                                               window.localStorage.setItem("sender",oData.sender_name);
                                                            }
                                                            app.share(arrEmail,oData.sender_name,oData.email_body);
                                                            
                                                         }
                                                      }
                                                   },
                                 BtnCancel       : function(jwin){
                                                      jwin.close("Cancel"); 
                                                   }
                              };
               jWin.setFormData(oFormInitValue);
               if ( dialog ){
                  dialog.init();
               }
            }
       );
};

iPaintApp.prototype.openURLDialog = function(){
   var app = this;
   new jsWindow(this.winMgr)
      .createDialog("openurl","Open URL",420,100)
      .load("/bundles/m3ipaint/iPaint/dialog/open-url.html",
            function(jWin,sHTML){
               
               var oFormInitValue = 
                              {
                                 URL  : "",
                                 BtnOK          : function(jwin){
                                                     var oData = jwin.getFormData();
                                                     var sURL = oData.URL;
                                                     jwin.close("OK"); 
                                                  },
                                 BtnCancel      : function(jwin){
                                                     jwin.close("Cancel"); 
                                                  }
                              };
               jWin.setFormData(oFormInitValue);
               if ( dialog ){
                  dialog.open(jWin,app);
               }
            }
      );
};

iPaintApp.prototype.openGalleryDialog = function(){
   var app = this;
   new jsWindow(this.winMgr)
      .createDialog("open_gallery","iPaint Gallery",420,100)
      .load("/bundles/m3ipaint/iPaint/dialog/open-gallery.html",
            function(jWin,sHTML){
               
               var oFormInitValue = 
                              {
                                 URL  : "",
                                 BtnOK          : function(jwin){
                                                     var oData = jwin.getFormData();
                                                     var sURL = oData.URL;
                                                     jwin.close("OK"); 
                                                     //PaintPro._mi_file_open(sURL);
                                                     
                                                  },
                                 BtnCancel      : function(jwin){
                                                     jwin.close("Cancel"); 
                                                  }
                              };
               jWin.setFormData(oFormInitValue);
               if ( dialog ){
                  dialog.open(jWin,app);
               }
            }
      );
};


iPaintApp.prototype.openResizeDialog = function(){
   var app = this;
   return new jsWindow(this.winMgr)
      .createDialog("resize_image","Resize Image ...",310,190)
      .load("/bundles/m3ipaint/iPaint/dialog/resize.html",
            function(jWin,sHTML){
               var oFormInitValue = 
                              {
                                 resize_by : "per",
                                 resize_h  : "100",
                                 resize_w  : "100",
                                 BtnOK     : function(jwin){
                                                dialog.apply(app.trackableObject);
                                                jwin.close("OK"); 
                                             },
                                 BtnApply  : function(jwin){
                                                dialog.apply(app.trackableObject);
                                             },
                                 BtnCancel : function(jwin){
                                                jwin.close("Cancel"); 
                                             }
                              };
               jWin.setFormData(oFormInitValue);
               if ( dialog ){
                  dialog.init(app.trackableObject);
               }
            }
       );
};

iPaintApp.prototype.openRotateDialog = function(){
   var app = this;
   return new jsWindow(this.winMgr)
      .createDialog("rotate_image","Rotate Image ...",310,230)
      .load("/bundles/m3ipaint/iPaint/dialog/rotate.html",
            function(jWin,sHTML){
               var oFormInitValue = 
                              {
                                 rotate    : "90",
                                 BtnOK     : function(jwin){
                                                dialog.apply(app.trackableObject);
                                                jwin.close("OK"); 
                                             },
                                 BtnApply  : function(jwin){
                                                dialog.apply(app.trackableObject);
                                             },
                                 BtnCancel : function(jwin){
                                                jwin.close("Cancel"); 
                                             }
                              };
               jWin.setFormData(oFormInitValue);
               if ( dialog ){
                  dialog.init(app.trackableObject);
               }
            }
       );
};

iPaintApp.prototype.openAboutDialog = function(){
   var app = this;
   new jsWindow(this.winMgr)
      .createDialog("open_gallery","iPaint Gallery",340,220)
      .load("/bundles/m3ipaint/iPaint/dialog/about-ipaint.html",
            function(jWin,sHTML){
            }
      );
};
iPaintApp.prototype.createCanvas = function(imgData){
   if ( !this.canvas_template ){
      this.canvas_template = document.createElement("canvas");
   }
   this.canvas_template.width = imgData.width; this.canvas_template.height = imgData.height;
   this.canvas_template.getContext("2d").putImageData(imgData,0,0);
   return this.canvas_template;
};

iPaintApp.prototype.getAttributeString = function(){
   return [
      this.image_name,
      this.width,
      this.height,
      this.unit,
      [this.PaintingAttribute.ForeColor.r,this.PaintingAttribute.ForeColor.g,this.PaintingAttribute.ForeColor.b,this.PaintingAttribute.ForeColor.a].join(","),
      [this.PaintingAttribute.BackColor.r,this.PaintingAttribute.BackColor.g,this.PaintingAttribute.BackColor.b,this.PaintingAttribute.BackColor.a].join(","),
      this.PaintingAttribute.Opacity,
      this.PaintingAttribute.BackType,
      this.PaintingAttribute.FillMode,
      this.PaintingAttribute.Outline,
      this.PaintingAttribute.LineWidth,
      this.PaintingAttribute.LineJoin,
      this.PaintingAttribute.LineCap,
      this.PaintingAttribute.font.name,
      this.PaintingAttribute.font.size,
      this.PaintingAttribute.font.weight,
      this.PaintingAttribute.font.style,
      this.PaintingAttribute.BackType
   ].join("|");
};
iPaintApp.prototype.setAttributeString = function(s){
   var isLogging = this.canvas_history.isLogging();
   this.canvas_history.stopLogging();
   var arr = s.split("|"), index = 0;
   
   this.image_name = arr[index++];
   this.width      = parseInt(arr[index++],10);
   this.height     = parseInt(arr[index++],10);
   this.unit       = arr[index++];
   var foreColor   = arr[index++].split(","); this.foreColor({r:parseInt(foreColor[0],10),g:parseInt(foreColor[1],10),b:parseInt(foreColor[2],10),a:parseFloat(foreColor[3])});
   var backColor   = arr[index++].split(","); this.backColor({r:parseInt(backColor[0],10),g:parseInt(backColor[1],10),b:parseInt(backColor[2],10),a:parseFloat(backColor[3])});
   var opacity     = parseFloat(arr[index++]);        
   this.opacity(opacity);
   
   this.PaintingAttribute.BackType = arr[index++];
   var fillMode    = arr[index++]; this.fillMode(fillMode);           
   var outline     = arr[index++]; this.outline(outline);
   var lineWidth   = arr[index++]; this.lineWidth(parseInt(lineWidth,10));
   var lineJoin    = arr[index++]; this.lineJoin(lineJoin);
   var lineCap     = arr[index++]; this.lineCap(lineCap);
   var fontName    = arr[index++];
   var fontSize    = arr[index++]; 
   var fontWeight  = arr[index++]; 
   var fontStyle   = arr[index++]; 
   this.font(fontSize,fontName,"start","top",fontWeight,fontStyle);
   var background  = arr[index++]; if ( !background ){background="white";} this.canvasBackground(background);
   this.sizeTo(this.width,this.height);
   
   if ( isLogging ){
      this.canvas_history.startLogging();
   }
    
   return this;
};

iPaintApp.prototype.undo = function(){
   this.canvas_history.undo();
};

iPaintApp.prototype.redo = function(){
   this.canvas_history.redo();
};

iPaintApp.prototype.startLogging = function(){
   this.canvas_history.startLogging();
};

iPaintApp.prototype.stopLogging = function(){
   this.canvas_history.stopLogging();
};

iPaintApp.prototype.initHistory = function(){
   this.canvas_history.init();
};
iPaintApp.prototype.synchronizeHistory = function(){
   this.canvas_history.synchronizeHistory();
};
iPaintApp.prototype.removeHistory = function(){
   this.canvas_history.removeEntry();
};
iPaintApp.prototype.refresh = function(){
   this.storeHistory();

   this.context.clearRect(0,0,this.width,this.height);
   this.context_draft.clearRect(0,0,this.width,this.height);
   this.context_draft1.clearRect(0,0,this.width,this.height);
   
   this.startLogging();
   this.initHistory();
   this.synchronizeHistory();
};

iPaintApp.prototype.viewHistory = function(){
   if ( supports_storage() ){
      var arrResult = [];
      var base_attr = window.localStorage.getItem("baseattr");
      var nTotalEntry = window.localStorage.getItem("totalentry");
      if ( nTotalEntry ){
         nTotalEntry = parseInt(nTotalEntry,10);
      }else{
         nTotalEntry = 0;
      }
      var arr = base_attr.split("|"), index = 0;
      arrResult.push("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
      
      arrResult.push("<!--");
      arrResult.push(" +---------------------------------------------------------+");
      arrResult.push(" |                          iPaint                         |");
      arrResult.push(" |                                                         |");
      arrResult.push(" |             Copyright @ 2011 www.jswidget.com           |");
      arrResult.push(" |                    All rights reserved.                 |");
      arrResult.push(" |                    support@jswidget.com                 |");
      arrResult.push(" +---------------------------------------------------------+");
      arrResult.push("-->");
      arrResult.push("<ipaint-history entries=\"" + nTotalEntry + "\" version=\"0.01\" datecreated=\"" + (new Date()) + "\">");
      arrResult.push("  <base-attribute>");
      arrResult.push("    <image>" + arr[index++] + "</image>");
      arrResult.push("    <width>" + arr[index++] + "</width>");
      arrResult.push("    <height>" + arr[index++] + "</height>");
      arrResult.push("    <unit>" + arr[index++] + "</unit>");
      arrResult.push("    <foreground>RGBA(" + arr[index++] + ")</foreground>");
      arrResult.push("    <background>RGBA(" + arr[index++] + ")</background>");
      arrResult.push("    <opacity>" + (arr[index++]*100) + "%</opacity>");
      arrResult.push("    <canvas-background>" + arr[index++] + "</canvas-background>");
      arrResult.push("    <fill-mode>" + arr[index++] + "</fill-mode>");
      arrResult.push("    <outline>" + arr[index++] + "</outline>");
      arrResult.push("    <line-width>" + arr[index++] + "</line-width>");
      arrResult.push("    <line-join>" + arr[index++] + "</line-join>");
      arrResult.push("    <line-cap>" + arr[index++] + "</line-cap>");
      arrResult.push("    <font-family>" + arr[index++] + "</font-family>");
      arrResult.push("    <font-size>" + arr[index++] + "</font-size>");
      arrResult.push("    <font-weight>" + arr[index++] + "</font-weight>");
      arrResult.push("    <font-style>" + arr[index++] + "</font-style>");
      arrResult.push("    <canvas-background>" + arr[index++] + "</canvas-background>");
      arrResult.push("  </base-attribute>");
      
      var i;
      for ( i = 0; i < nTotalEntry; i ++ ){
         arrResult.push("  <entry>");
         var s = window.localStorage.getItem("hist_" + i);
         var tmp = s.split("@");
         var sLabel = tmp[0];
         var arrData  = tmp[1].split("|");
         var sData = "";
         if ( arrData[0] === "openimage" ){
            sData = "image";
         }else{
            arrData.splice(0,1);
            sData = arrData.join(",");
         }
         
         arrResult.push("    <action>" + sLabel + "</action>");
         arrResult.push("    <data>" + sData + "</data>");
         arrResult.push("  </entry>");
      }
      arrResult.push("</ipaint-history>");
      
      var str = arrResult.join("###BR###");
      str = str.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/ /g,"&nbsp;").replace(/###BR###/g,"<br/>");
      str = "<div style='font:12px Courier;line-height:20px;'>" + str + "</div>";
      var w = $(window).width()/4,
          h = $(window).height(),
          l = $(window).width() - w - 20,
          t = 0;
      var win = window.open("", "ipaint_history_window", "left=" + l + ",top=" + t + ",width=" + w + ",height=" + h + "," +
                             "scrollbars=yes,resizable=yes,status=no," +
                             "location=no,menubar=no,toolbar=no");
      if (!win){return;}
      var doc = win.document;
      doc.write(str);
      doc.title = "iPaint Painting History";
      win.focus();
      doc.close();
   }
};
