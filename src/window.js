//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : jsWindowManager
//
// parent class : jsToolObject
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
// jsWindowManager encapsulates a <div></div> element to be the container of all the jsWindow objects. An jsWindow is actually another DOM
// hirachies. So each jsWindow will be a child of jsWindowManager. 
//
//  ---------------------------------------------------------------------
//  |                                                             root  |
//  |                                                    jsWindowManager|
//  |   -----------------------                                         |
//  |   |          jsWindow   |                                         |
//  |   |                     |                                         |
//  |   |                     |                                         |
//  |   |                     |                                         |
//  |   |                     |                                         |
//  |   -----------------------                                         |
//  |                                                                   |
//  |                                                                   |
//  |                                 --------------------------        |
//  |                                 |            jsWindow    |        |
//  |                                 |                        |        |
//  |                                 |                        |        |
//  |                                 |                        |        |
//  |                                 |                        |        |
//  |                                 --------------------------        |
//  |                                                                   |
//  |                                                                   |
//  ---------------------------------------------------------------------
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function jsWindowManager(id,zStart){
   //
   // The root is usually a <div></div> container element. All the windows object will be actually
   // the children elements.
   if ( typeof(id) === "string" ){
      this.dom_root = document.getElementById(id);
   }else if ( typeof(id) === "object" ){
      this.dom_root = id;
   }else{
      this.dom_root = document.body;
   }
   
   //
   // An array that contains all the jsWindow object instance. Each element in the array is an 
   // object: 
   //    {
   //       jwindow: object of class jsWindow,
   //       index  : index of this jwindow within the jsWindowManager
   //    }
   this.windows = [];
   
   //
   // Current zIndex that can be assigned to next new jsWindow
   this.zIndex  = zStart || 1;
   
   //
   // The position of the first jsWindow instance
   this.windowPos = {left:10,top:10};
   
   //
   // ????????????????????
   this.modalDialog = [];
   
   this.getRoot = function(){return this.dom_root;};
}

//-----------------------------------------------------------------------------------------------------------------------------------------
// This method is for debugging purpose
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.toString = function(){
   var i;
   var s = "current z-index = " + this.zIndex + "<br/>";
   for ( i = 0; i < this.windows.length; i ++ ){
      s += "z-index: " + this.windows[i].jwindow.getZIndex() + ", " + 
                         this.windows[i].index  + " = " + 
                         this.windows[i].jwindow.getTitle() + "<br/>";
   }
   s += "<br/>";
   return s;
};

//-----------------------------------------------------------------------------------------------------------------------------------------
// Return the bounds of the element dom_root
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.getBounds = function(){
   var off = $(this.dom_root).offset();
   return new Rectangle(off.left,off.top,$(this.dom_root).width(),$(this.dom_root).height());
};

//-----------------------------------------------------------------------------------------------------------------------------------------
// This function returns the position for next jsWindow object so that new created window will not overlap on top with current window.
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.nextWindowPos = function(){
   var step = 24;
   this.windowPos = {left:10 + (this.windows.length-1) * 24,top:10 + (this.windows.length-1) * 24};
   
   var range = this.getBounds();
   if ( this.windowPos.left + step > range.width ){
      this.windowPos.left = 10;
   }
   if ( this.windowPos.top + step > range.height ){
      this.windowPos.top = 10 + step;
   }
   this.windowPos.left += step;
   this.windowPos.top  += step;
   return {left:this.windowPos.left - step,top:this.windowPos.top  - step};
};
//-----------------------------------------------------------------------------------------------------------------------------------------
// Re-arrange all jsWindow object in cascade mode
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.cascade = function(){
   var r = this.getBounds();
   var nw = Math.round(r.width * 0.6), nh = Math.round(r.height * 0.7);
   var step = 24;
   var i;
   for ( i = 0; i < this.windows.length; i ++ ){
      var jwin = this.windows[i].jwindow;
      var ndx = this.windows[i].index - 1;
      var left = 10 + ndx * 24, top =  10 + ndx * 24;
      jwin.resize(nw,nh);
      jwin.moveTo(left,top);
   }
};
//-----------------------------------------------------------------------------------------------------------------------------------------
// Get next available zindex number for the new window
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.getZIndex = function(){
   return this.zIndex;
};
//-----------------------------------------------------------------------------------------------------------------------------------------
// Add a window object to the window manager. All current window objects will be inactivated. The new window will have index default to
// the zIndex.
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.add = function(win){
   var i;
   //
   // Inactive all current window objects
   for ( i = 0; i < this.windows.length; i ++ ){
      this.windows[i].jwindow.inactiveWindow();
   }
   
   //
   // Add win to the pool
   this.windows.push({jwindow:win,index:this.zIndex});
   
   //
   // Update zIndex for next window
   this.zIndex ++;
};

//-----------------------------------------------------------------------------------------------------------------------------------------
// Remove specified window object from window manager. This will only remove the win from the jsWindowManager. The win object is still in
// the memory that needs to be destoried.
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.remove = function(win){
   var zindex = -1, i;

   this.toTop(win);
   
      
   for ( i = 0; i < this.windows.length; i ++ ){
      if ( win === this.windows[i].jwindow ){
         zindex = this.windows[i].index;
         this.windows.splice(i,1);
         break;
      }
   }
   
   //
   // zindex != -1 means we found the specified window. zindex now holds the index of that window
   if ( zindex !== -1 ){
      var maxZ = 0;
      
      //
      // update the window's index. The index of any window that is on top of this window will be
      // minus 1 from their current index;
      for ( i = 0; i < this.windows.length; i ++ ){
         if ( zindex < this.windows[i].index ){
            this.windows[i].index--;
            this.windows[i].jwindow.setZIndex(this.windows[i].index);
         }
         maxZ = Math.max(maxZ,this.windows[i].index);
      }
      this.zIndex = maxZ + 1;
      for ( i = 0; i < this.windows.length; i ++ ){
         if ( maxZ === this.windows[i].index ){
            this.windows[i].jwindow.activeWindow(true);
            break;
         }
      }
   }
   return this;
};
//-----------------------------------------------------------------------------------------------------------------------------------------
// Inactive all the windows within the manager
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.inactiveAll = function(){
   var i;
   for ( i = 0; i < this.windows.length; i ++ ){
      this.windows[i].jwindow.inactiveWindow();
   }
};

//-----------------------------------------------------------------------------------------------------------------------------------------
// Active top window within the manager. The top window is the window with the max z-index value
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.activeTopWindow = function(callback){
   var zindex = 0, jwin = null, i;
   for ( i = 0; i < this.windows.length; i ++ ){
      if ( zindex < this.windows[i].index ){
         jwin = this.windows[i].jwindow;
         zindex = this.windows[i].index;
      }
   }
   if ( jwin ){
      jwin.activeWindow(callback);
   }
   return this;
};

//-----------------------------------------------------------------------------------------------------------------------------------------
// Move specified window object to top. The window must be in the manager
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.toTop = function(win){
   var zindex = win.getZIndex(),i;
   if ( zindex === (this.zIndex-1) ){
      return this;
   }
   
   for ( i = 0; i < this.windows.length; i ++ ){
      if ( this.windows[i].index > zindex ){
         this.windows[i].index --;
         this.windows[i].jwindow.setZIndex(this.windows[i].index);
         this.windows[i].jwindow.inactiveWindow();
      }else if (zindex === this.windows[i].index){
         this.windows[i].jwindow.setZIndex(this.zIndex-1);
         this.windows[i].index = this.zIndex-1;
      }
   }
         
   return this;
};

//-----------------------------------------------------------------------------------------------------------------------------------------
// get the top-most window, ie the window with max z-index value;
//-----------------------------------------------------------------------------------------------------------------------------------------
jsWindowManager.prototype.getTopWindow = function(){
   var zindex = 0, jwin = null,i;
   for ( i = 0; i < this.windows.length; i ++ ){
      if ( zindex < this.windows[i].index ){
         jwin = this.windows[i].jwindow;
         zindex = this.windows[i].index;
      }
   }
   
   return jwin;
};

function jsWindowObject(){}

jsWindowObject.prototype.setZIndex = function(zIndex){
   throw "Subclass must implements setZIndex function";
};
jsWindowObject.prototype.getZIndex = function(){
   throw "Subclass must implements getZIndex function";
};
jsWindowObject.prototype.getTitle  = function(){
   throw "Subclass must implements getTitle function";
};
jsWindowObject.prototype.activeWindow = function(callback){
   throw "Subclass must implements activeWindow function";
};
jsWindowObject.prototype.inactiveWindow = function(){
   throw "Subclass must implements inactiveWindow function";
};


//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : jsWindow
//
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
// jsWindow encapsulates the window object. 
//-----------------------------------------------------------------------------------------------------------------------------------------
function jsWindow(winMgr){
   this.winManager      = winMgr;
   this.dom             = {};
   this.isActive        = true;
   this.isContentLoaded = false;
   
   //
   // nWidth/nHeight is the inner available size of the window, i.e the size of div.content element
   this.onResize        = function(jWin,nWidth,nHeight){}; 
   this.onClose         = function(){};

   //
   // define the minimum size when you adjust the size of the window by dragging the four borders and four corners.
   this.minSizeWidth    = 150;
   this.minSizeHeight   = 150;
   
   //
   // save the status of the window: maximize, minimize or normal
   this.window_restore  = null;
}  
jsWindow.prototype = new jsWindowObject();
jsWindow.prototype.constructor = jsWindow;

//
// define the constant for setting the window's system icons
jsWindow.MAXIMIZE = 1;
jsWindow.MINIMIZE = 2;
jsWindow.CLOSE    = 4;

jsWindow.prototype.setWindowManager = function(winMgr){
   this.winManager      = winMgr;
   return this;
};
jsWindow.prototype.getID = function(){
   return this.id;
};

jsWindow.prototype.setMinimumSize = function(w,h){
   this.minSizeWidth    = w;
   this.minSizeHeight   = h;
   return this;
};

jsWindow.prototype.setZIndex = function(zindex){
   $(this.dom.window).css({zIndex:zindex});
   return this;
};

jsWindow.prototype.getZIndex = function(){
   return parseInt($(this.dom.window).css("zIndex"),10);
};

jsWindow.prototype.activeWindow = function(callback){
   if ( this.isActive ){return this;}
   this.isActive = true;
   if ( !(this.type === "dialog" && this.dialogType === "modal") ){
      this.winManager.toTop(this);
   }
   $(this.dom.title).removeClass("title_inactive").addClass("title");
   $(this.dom.spacerL).removeClass("spacerLInactive").addClass("spacerL");
   $(this.dom.spacerR).removeClass("spacerRInactive").addClass("spacerR");
   $(this.dom.content_container).removeClass("inactive");
   if ( callback && this.onActive && typeof(this.onActive) === "function" ){
      this.onActive();
   }
   return this;
};

jsWindow.prototype.inactiveWindow = function(){
   if ( !this.isActive ){return this;}
   this.isActive = false;
   
   $(this.dom.title).removeClass("title").addClass("title_inactive");
   $(this.dom.spacerL).removeClass("spacerL").addClass("spacerLInactive");
   $(this.dom.spacerR).removeClass("spacerR").addClass("spacerRInactive");
   $(this.dom.content_container).addClass("inactive");
   if ( this.onInactive && typeof(this.onInactive) === "function" ){
      this.onInactive();
   }
   return this;
};

jsWindow.prototype.getTitle = function(){
   return this.title;
};

jsWindow.prototype.setTitle = function(sTitle){
   this.title = sTitle;
   
   $(this.dom.title).html(this._shortenTitle(sTitle)).attr("title",this.title);
   return this;
};

jsWindow.prototype.createDialog = function(id,title,w,h,type){
   id = id || PP_GLOBAL.GUID();
   var dialog_mask = null;
   this.id = id;
   this.title = title;
   
   this.window_type = "dialog";
   this.window_dialogType = type || "modal"; //can be modal or modeless
   
   var _this = this;
   var zDialog = this.winManager.getZIndex();
   
   var root = this.winManager.getRoot();
   if ( this.window_dialogType === "modal" ){
      var mw = window.innerWidth;
      var mh = window.innerHeight;
      
      var zMask = 1000 + this.winManager.modalDialog.length * 2;
      zDialog = zMask + 1;
      
      $(document.body)
         .append(
            $("<div></div>")
               .attr("id","dialog_mask")
               .css({position       : "absolute",
                     opacity        : 0,
                     backgroundColor: "#ffffff",
                     left           : "0px",
                     top            : "0px",
                     width          : mw+"px",
                     height         : mh+"px",
                     zIndex         : zMask})
               .each(function(){dialog_mask=this;})
          );
      var nCount = this.winManager.modalDialog.length;
      if ( nCount === 0 ){
         this.winManager.inactiveAll();
      }else{
         this.winManager.modalDialog[nCount-1].jwindow.inactiveWindow();
         
      }
      root = document.body;
   }
   
   $(root)
      .append(
         $("<div></div>")
            .attr({id: id,className:"window"})
            .each(function(){_this.dom.window = this;})
            .css({width:w + "px",height:h+"px",zIndex:zDialog,opacity:0.1})
            .append($("<div></div>").addClass("spacerL").each(function(){_this.dom.spacerL = this;}))
            .append($("<div></div>").addClass("title").attr("title",title).html(title).each(function(){_this.dom.title = this;}))
            .append($("<div></div>").addClass("spacerR").each(function(){_this.dom.spacerR = this;}))
            .append($("<div></div>").addClass("btn_close").attr({title:"Close"}).each(function(){_this.dom.close = this;}))
            .append(
               $("<div></div>").addClass("content_container_dialog")
                  .append(
                     $("<div></div>").addClass("content").each(function(){_this.dom.content = this;})
                  ).each(function(){_this.dom.content_container = this;})
             )
            .animate(
               {opacity:1},300
            )
      );

   if ( this.window_dialogType === "modeless" ){
      this.winManager.add(this);
   }

   var left = Math.round((window.innerWidth - w)/2);
   var top  = Math.round((window.innerHeight - h)/2);
   $(this.dom.window).css({left:left + "px",top:top + "px"});
   
   var bounds = this.winManager.getBounds();      
   Drag.init(this.dom.title,this.dom.window,0,bounds.width - 15,0,bounds.height - 60);
   this.dom.window.onDragStart = function(event,x,y){
      var bounds = _this.winManager.getBounds();     
      Drag.obj.maxX = bounds.width - 15;
      Drag.obj.maxY = bounds.height - 60;
   };
   
   if ( this.window_dialogType === "modeless" ){
      $(this.dom.title)
         .bind("mousedown",function(){_this.activeWindow(true);});
         
      //attach native event handler
      $(this.dom.window)
         .bind("click", function(){
                           _this.activeWindow(true);
                        });
   }
   
   $(this.dom.close)
      .bind("mouseover",function(){
                           this.className = "btn_close_over";
                        })
      .bind("mouseout",function(){
                           this.className = "btn_close";
                        })
      .bind("click",function(){
                           _this.close();
                        });

   if ( this.window_dialogType === "modal" ){
      this.winManager.modalDialog.push({jwindow:this,mask:dialog_mask});
   }
   return this;   
};
jsWindow.prototype._shortenTitle = function(s){
   if ( s.length > 50 ){
      var ns = s.substr(0,24) + "......";
      ns += s.substr(s.length - 20,20);
      return ns;
   }
   return s;
};
jsWindow.prototype.create = function(id,title,w,h,mask){
   id = id || PP_GLOBAL.GUID();
   this.id = id;
   this.title = title;
   this.window_type = "window";
      
   var _this = this;
   
   mask = mask || (jsWindow.MAXIMIZE|jsWindow.MINIMIZE|jsWindow.CLOSE);

   $(this.winManager.getRoot())
      .append(
         $("<div name='window'></div>")
            .attr({id: id,className:"window"})
            .each(function(){_this.dom.window = this;})
            .css({width:w + "px",height:h + "px",zIndex:this.winManager.getZIndex(),opacity:1})
            .append($("<div name='spacerL'></div>")
                     .addClass("spacerL")
                     .each(function(){_this.dom.spacerL = this;})
                   )
            .append($("<div name='title'></div>")
                     .addClass("title")
                     .attr("title",title)
                     .html(_this._shortenTitle(title))
                     .each(function(){_this.dom.title = this;})
                   )
            .append($("<div name='spacerR'></div>")
                     .addClass("spacerR")
                     .each(function(){_this.dom.spacerR = this;}))
      );

   if ( (mask & jsWindow.MINIMIZE) === jsWindow.MINIMIZE ){
      $(this.dom.window)
               .append($("<div name='minimize'></div>")
                        .addClass("btn_minimize")
                        .attr({title:"Minimize"})
                        .each(function(){_this.dom.minimize = this;}));
   }
   
   if ( (mask & jsWindow.MAXIMIZE) === jsWindow.MAXIMIZE ){
      $(this.dom.window)            
               .append($("<div name='maximize'></div>")
                        .addClass("btn_maximize")
                        .attr({title:"Maximize"})
                        .each(function(){_this.dom.maximize = this;}));
   }
   
   if ( (mask & jsWindow.CLOSE) === jsWindow.CLOSE ){
      $(this.dom.window)
               .append($("<div name='close'></div>")
                        .addClass("btn_close")
                        .attr({title:"Close"})
                        .each(function(){_this.dom.close = this;}));
   }
   
   $(this.dom.window)
     .append($("<div name='content_container'></div>").addClass("content_container_window")
               .append($("<div></div>")
                        .addClass("content")
                        .each(function(){_this.dom.content = this;})
                      )
               .append($("<div></div>")
                        .addClass("status_bar")
                        .each(function(){_this.dom.status_bar = this;})
                      )                     
               .each(function(){_this.dom.content_container = this;})
            )
     .append($("<div class='resize_indicator top-left' name='top_left'></div>")
               .each(function(){_this.dom.top_left = this;})
            )
     .append($("<div class='resize_indicator top-right' name='top_right'></div>")
               .each(function(){_this.dom.top_right = this;})
            )
     .append($("<div class='resize_indicator bottom-left' name='bottom_left'></div>")
               .each(function(){_this.dom.bottom_left = this;})
            )
     .append($("<div class='resize_indicator bottom-right' name='bottom_right'></div>")
               .each(function(){_this.dom.bottom_right = this;})
            )
     .append($("<div class='resize_indicator to-left' name='to_left'></div>")
               .each(function(){_this.dom.to_left = this;})
            )
     .append($("<div class='resize_indicator to-right' name='to_right'></div>")
               .each(function(){_this.dom.to_right = this;})
            )
     .append($("<div class='resize_indicator to-bottom' name='to_bottom'></div>")
               .each(function(){_this.dom.to_bottom = this;})
            )
     .append($("<div class='resize_indicator to-top' name='to_top'></div>")
               .each(function(){_this.dom.to_top = this;})
            );
            

   this.winManager.add(this);

   var pos = this.winManager.nextWindowPos();
   $(this.dom.window).css({left:pos.left + "px",top:pos.top + "px"});

   this.window_status = "normal";
   this.saveStatus();
   
   var bounds = this.winManager.getBounds();
   Drag.init(this.dom.title,this.dom.window,100-w,bounds.width - 15,0,bounds.height - 30);
   this.dom.window.onDragStart = function(event,x,y){
      var bounds = _this.winManager.getBounds();     
      Drag.obj.maxX = bounds.width - 15;
      Drag.obj.maxY = bounds.height - 60;
   };
   
   $(this.dom.title)
      .bind("mousedown",function(){_this.activeWindow(true);});
      
   //attach native event handler
   $(this.dom.window)
      .bind("click", function(){
                        _this.activeWindow(true);
                     });

   $(this.dom.title)
      .bind("dblclick",function(){
                          switch(_this.window_status){
                          case "minimize":
                              _this.restore();
                              _this.dom.minimize.className = "btn_minimize";
                              _this.dom.minimize.title     = "Minimize";
                              break;
                          case "maximize":
                              _this.restore();
                              _this.dom.maximize.className = "btn_maximize";
                              _this.dom.maximize.title     = "Maximize";
                              break;
                          case "normal":
                              _this.maximize();
                              _this.dom.maximize.className = "btn_maximizerestore";
                              _this.dom.maximize.title     = "Restore Down";
                              _this.dom.minimize.className = "btn_minimize";
                              _this.dom.minimize.title     = "Minimize";
                              break;
                          }
                       });

   $(this.dom.spacerL)
      .bind("dblclick",function(){
                           _this.close();
                        });
   $(this.dom.close)
      .bind("mouseover",function(){
                           this.className = "btn_close_over";
                        })
      .bind("mouseout",function(){
                           this.className = "btn_close";
                        })
      .bind("click",function(){
                           _this.close();
                        });

   $(this.dom.minimize)
      .bind("mouseover",function(){
                           if ( this.className === "btn_minimize" ){
                              this.className = "btn_minimize_over";
                           }
                           if ( this.className === "btn_minimizerestore" ){
                              this.className = "btn_minimizerestore_over";
                           }
                        })
      .bind("mouseout",function(){
                           if ( this.className === "btn_minimize_over" ){
                              this.className = "btn_minimize";
                           }
                           if ( this.className === "btn_minimizerestore_over" ){
                              this.className = "btn_minimizerestore";
                           }
                        })
      .bind("click",function(){
                           if ( _this.window_status === "minimize" ){
                              _this.restore();
                              this.className = "btn_minimize";
                              this.title = "Minimize";
                           }else{
                              this.className = "btn_minimizerestore";
                              this.title = "Restore Up";
                              _this.minimize();
                           }
                           _this.dom.maximize.className = "btn_maximize";
                           _this.dom.maximize.title     = "Maximize";
                        });

   $(this.dom.maximize)
      .bind("mouseover",function(){
                           if ( this.className === "btn_maximize" ){
                              this.className = "btn_maximize_over";
                           }
                           if ( this.className === "btn_maximizerestore" ){
                              this.className = "btn_maximizerestore_over";
                           }
                        })
      .bind("mouseout",function(){
                           if ( this.className === "btn_maximize_over" ){
                              this.className = "btn_maximize";
                           }
                           if ( this.className === "btn_maximizerestore_over" ){
                              this.className = "btn_maximizerestore";
                           }
                        })
      .bind("click",function(){
                           if ( _this.window_status === "maximize" ){
                              _this.restore();
                              this.className = "btn_maximize";
                              this.title = "Maximize";
                           }else{
                              this.className = "btn_maximizerestore";
                              this.title = "Restore Down";
                              _this.maximize();
                           }
                           _this.dom.minimize.className = "btn_minimize";
                           _this.dom.minimize.title     = "Minimize";
                        });

   function dragStart(jwin){
      jwin.activeWindow(true);
      jwin.left   = $(jwin.dom.window).position().left;
      jwin.top    = $(jwin.dom.window).position().top;
      jwin.width  = $(jwin.dom.window).width(); 
      jwin.height = $(jwin.dom.window).height();
   }
   
   function dragging(jwin,x,y,bLeft,bTop,bWidth,bHeight){
      var nLeft  = (bLeft) ? jwin.left+x : jwin.left,  nTop = (bTop) ? jwin.top+y : jwin.top;
      var nWidth = (bWidth) ? jwin.width-x : jwin.width, nHeight = (bHeight) ? jwin.height-y : jwin.height;
      if ( nWidth < jwin.minSizeWidth ){
         nWidth = jwin.minSizeWidth;  
      }
      if ( nHeight < jwin.minSizeHeight ){
         nHeight = jwin.minSizeHeight;  
      }
      $(jwin.dom.window).css({left:nLeft + "px",top:nTop + "px",width:nWidth + "px",height:nHeight + "px"});
      if ( typeof(jwin.onResize) === "function" ){
         jwin.onResize(jwin,jwin.innerWidth(),jwin.innerHeight());
      }
   }
   
   
   Drag.init(this.dom.top_left);
   this.dom.top_left.onDragStart     = function(event,x,y){dragStart(_this);};
   this.dom.top_left.onDrag          = function(event,x,y){dragging(_this,x,y,true,true,true,true);};
   this.dom.top_left.onDragEnd       = function(event,x,y){this.style.left = "0px"; this.style.top = "0px";_this.saveStatus();};
   
   Drag.init(this.dom.top_right,null,null,null,null,null,true,false);
   this.dom.top_right.onDragStart    = function(event,x,y){dragStart(_this);};
   this.dom.top_right.onDrag         = function(event,x,y){dragging(_this,x,y,false,true,true,true);};
   this.dom.top_right.onDragEnd      = function(event,x,y){this.style.right = "0px"; this.style.top = "0px";_this.saveStatus();};

   Drag.init(this.dom.bottom_right,null,null,null,null,null,true,true);
   this.dom.bottom_right.onDragStart = function(event,x,y){dragStart(_this);};
   this.dom.bottom_right.onDrag      = function(event,x,y){dragging(_this,x,y,false,false,true,true);};
   this.dom.bottom_right.onDragEnd   = function(event,x,y){this.style.right = "0px"; this.style.bottom = "0px";_this.saveStatus();};

   Drag.init(this.dom.bottom_left,null,null,null,null,null,false,true);
   this.dom.bottom_left.onDragStart  = function(event,x,y){dragStart(_this);};
   this.dom.bottom_left.onDrag       = function(event,x,y){dragging(_this,x,y,true,false,true,true);};
   this.dom.bottom_left.onDragEnd    = function(event,x,y){this.style.left = "0px"; this.style.bottom = "0px";_this.saveStatus();};

   Drag.init(this.dom.to_left,null,null,null,null,null,false,false);
   this.dom.to_left.style.top = "5px";
   this.dom.to_left.onDragStart      = function(event,x,y){dragStart(_this);};
   this.dom.to_left.onDrag           = function(event,x,y){dragging(_this,x,y,true,false,true,false);};
   this.dom.to_left.onDragEnd        = function(event,x,y){this.style.left = "0px"; this.style.top = "5px";this.style.bottom = "5px";_this.saveStatus();};

   Drag.init(this.dom.to_right,null,null,null,null,null,true,false);
   this.dom.to_right.style.top = "5px";
   this.dom.to_right.onDragStart     = function(event,x,y){dragStart(_this);};
   this.dom.to_right.onDrag          = function(event,x,y){dragging(_this,x,y,false,false,true,false);};
   this.dom.to_right.onDragEnd       = function(event,x,y){this.style.right = "0px"; this.style.top = "5px";this.style.bottom = "5px";_this.saveStatus();};

   Drag.init(this.dom.to_top,null,null,null,null,null,false,false);
   this.dom.to_top.style.left = "5px";
   this.dom.to_top.onDragStart       = function(event,x,y){dragStart(_this);};
   this.dom.to_top.onDrag            = function(event,x,y){dragging(_this,x,y,false,true,false,true);};
   this.dom.to_top.onDragEnd         = function(event,x,y){this.style.left = "5px"; this.style.top = "0px";this.style.right = "5px";_this.saveStatus();};

   Drag.init(this.dom.to_bottom,null,null,null,null,null,false,true);
   this.dom.to_bottom.style.left = "5px";
   this.dom.to_bottom.onDragStart    = function(event,x,y){dragStart(_this);};
   this.dom.to_bottom.onDrag         = function(event,x,y){dragging(_this,x,y,false,false,false,true);};
   this.dom.to_bottom.onDragEnd      = function(event,x,y){this.style.left = "5px"; this.style.bottom = "0px";this.style.right = "5px";_this.saveStatus();};
   

   if ( this.onCreate && typeof(this.onCreate) === "function" ) {
      this.onCreate();
   }
   return this;   
};

jsWindow.prototype.moveTo = function(left,top){
   $(this.dom.window).css({left:left + "px",top:top + "px"});
   return this;
};

jsWindow.prototype.resize = function(nw,nh,fnDone){
   if ( typeof(fnDone) === "function" ){
      var jwin = this;      
      $(this.dom.window).animate(
         {width:nw + "px", height:nh + "px"},200,
         function(){
            if ( typeof(jwin.onResize) === "function" ){
               jwin.onResize(jwin,jwin.innerWidth(),jwin.innerHeight());
            }
            fnDone(jwin);
         }
      );
   }else{
      var jwin = this;   
      $(this.dom.window).css({width:nw + "px", height:nh + "px"});
      if ( typeof(jwin.onResize) === "function" ){
         jwin.onResize(jwin,jwin.innerWidth(),jwin.innerHeight());
      }
   }
};

jsWindow.prototype.saveStatus = function(){
   this.window_restore = {left  : $(this.dom.window).position().left,
                          top   : $(this.dom.window).position().top,
                          width : $(this.dom.window).width(),
                          height: $(this.dom.window).height(),
                          status: this.window_status
                         };
};
jsWindow.prototype.getDOMContent = function(){
   return this.dom.content;
};
jsWindow.prototype.load = function(html,onLoad){
   var _this = this;
   
   $(this.dom.content).addClass("loading");
   $.ajax({
            url      : html,
            cache    : true,
            dataType : "text",
            error    : function(jqXHR,textStatus,errorThrown){
                          switch(textStatus){
                          case "timeout": break;
                          case "error": break;
                          case "abort": break;
                          case "parsererror": break;
                          }
                       },
            success  : function(sText,textStatus,XMLHttpRequest){
                          _this.isContentLoaded = true;
                          sText = sText.replace(/__AAAA__/g,_this.id);
                          $(_this.dom.content).removeClass("loading").html(sText);
                          
                          if ( typeof onLoad === "function" ){
                             onLoad(_this,sText);
                          }
                       }
          });
   return this;
};
jsWindow.prototype.getFormData = function(){
   if ( this.isContentLoaded ){
      var oFormValue = null;
      var _this = this;
      $(this.dom.content)
         .find("form")
         .each(function(){
                  oFormValue = _this._getValue(this);
               });
      return oFormValue;            
   }
   return null;
};
jsWindow.prototype.setFormData = function(oFormValue){
   if ( this.isContentLoaded ){
      var _this = this;
      $(this.dom.content)
         .find("form")
         .each(function(){
                   _this._setValue(this,oFormValue);
               });
   }
   return this;
};


jsWindow.prototype._setValue=function(eForm,oFormValue){
   var _this = this, elementName,i;
   for (elementName in oFormValue){
      if (oFormValue.hasOwnProperty(elementName)){
         var formElement = eForm[elementName];
         if (formElement){
            if ( formElement.type ){
               switch(formElement.type){
               case "checkbox": 
                  if (oFormValue[elementName] === "1" || 
                      oFormValue[elementName] === 1   || 
                      oFormValue[elementName] === "true" || 
                      oFormValue[elementName] === true){
                     formElement.element.checked = true;
                  }else{
                     formElement.element.checked = false;
                  }
                  break;
               case "select-one": 
               case "text": 
               case "textarea": 
               case "hidden": 
                  formElement.value=(oFormValue[elementName].toString());
                  break;
               case "select-multiple": 
                  this._setSelectedValue(formElement.element,oFormValue[elementName].split(","));
                  formElement.value=oFormValue[elementName];
                  break;
               case "radio": 
                  this._setRadioValue(formElement,oFormValue[elementName]);
                  break;
               case "submit":
               case "button":
                  if ( typeof(oFormValue[elementName]) === "function" ){
                     $(formElement).data("callback",oFormValue[elementName]).bind("click",
                                         function(){
                                            $(this).data("callback")(_this);
                                            return false; 
                                         });
                  }
                  break;                                      
               }
            }else{ // For group of radio box
               for ( i = 0; i < formElement.length; i ++ ){
                  var radio = formElement[i];
                  if ( radio.type === "radio" && radio.value === oFormValue[elementName] ){
                     radio.checked = true;
                  }else{
                     radio.checked = false;
                  }
               }
            }            
         }
      }
   }
   
};

jsWindow.prototype._getValue=function(eForm){
   var oRet={},i;
   var arrRet = $(eForm).serializeArray();
   for ( i = 0; i < arrRet.length; i ++ ){
      oRet[arrRet[i].name] = arrRet[i].value;
   }
   return oRet;
};

jsWindow.prototype._setSelectedValue=function(eSelect, arrValue){
   var i,j;
   for (j=eSelect.options.length-1;j>=0;j--){
      eSelect.options[j].selected=false;
      for (i=arrValue.length-1;i>=0;i--){
         if (eSelect.options[j].value===arrValue[i]){
            eSelect.options[j].selected=true;
         }
      }
   }
};

jsWindow.prototype._setRadioValue=function(eRadio, sVal){
   var i;
   var r=document.getElementsByName(eRadio.name);
   
   for (i=r.length-1;i>=0;i--){
      if (r[i].value===sVal){
         r[i].checked=true;
      }else{
         r[i].checked=false;
      }
   }
};


jsWindow.prototype.minimize = function(){
   if ( this.window_status === "normal" || this.window_status === "maximize"){
      if ( this.window_status === "normal" ){
         this.saveStatus();
      }
      
      this.window_status  = "minimize";                             
      this._width = 150; this._height = 24;
      this._left  = this.window_restore.left; this._top  = this.window_restore.top; 
      $(this.dom.window)
         .animate({
            left:this._left + "px",
            top:this._top + "px",
            width:this._width + "px",
            height:this._height + "px"},300);
      
      this.dom.top_left.style.display          = "none";
      this.dom.top_right.style.display         = "none";
      this.dom.bottom_left.style.display       = "none";
      this.dom.bottom_right.style.display      = "none";
      this.dom.to_left.style.display           = "none";
      this.dom.to_top.style.display            = "none";
      this.dom.to_right.style.display          = "none";
      this.dom.to_bottom.style.display         = "none";
      this.dom.status_bar.style.display        = "none";
      
   }      
};

jsWindow.prototype.maximize = function(){
   if ( this.window_status === "normal" || this.window_status === "minimize" ){
      if ( this.window_status === "normal" ){
         this.saveStatus();
      }
      
      this.window_status  = "maximize";
      this._width = $(this.winManager.getRoot()).width(); this._height = $(this.winManager.getRoot()).height()-15;
      this._left  = 0; this._top = 15;
      var jwin = this;
      $(this.dom.window).animate(
         {left:this._left + "px",top:this._top + "px",width:this._width + "px",height:this._height + "px"},
         300,
         function(){
            if ( typeof(jwin.onResize) === "function" ){
               jwin.onResize(jwin,jwin.innerWidth(),jwin.innerHeight());
            }
         });
         
      
      this.dom.top_left.style.display          = "none";
      this.dom.top_right.style.display         = "none";
      this.dom.bottom_left.style.display       = "none";
      this.dom.bottom_right.style.display      = "none";
      this.dom.to_left.style.display           = "none";
      this.dom.to_top.style.display            = "none";
      this.dom.to_right.style.display          = "none";
      this.dom.to_bottom.style.display         = "none";
      this.dom.status_bar.style.display        = "";

   }      
};

jsWindow.prototype.restore = function(){
   if ( this.window_status === "minimize" || this.window_status === "maximize" ){
      this.window_status = "normal";
      
      this.dom.content_container.style.display = "";
      this.dom.top_left.style.display          = "";
      this.dom.top_right.style.display         = "";
      this.dom.bottom_left.style.display       = "";
      this.dom.bottom_right.style.display      = "";
      this.dom.to_left.style.display           = "";
      this.dom.to_top.style.display            = "";
      this.dom.to_right.style.display          = "";
      this.dom.to_bottom.style.display         = "";
      this.dom.status_bar.style.display        = "";
      
      var jwin = this;
      $(this.dom.window).animate({left:this.window_restore.left + "px",top:this.window_restore.top + "px",
                                    width:this.window_restore.width + "px",height:this.window_restore.height + "px"},
                                    300,
                                    function(){
                                       if ( typeof(jwin.onResize) === "function" ){
                                          jwin.onResize(jwin,jwin.innerWidth(),jwin.innerHeight());
                                       }
                                    });
                                    
      this.saveStatus();
   }
};

jsWindow.prototype.close = function(sFlag,animiation,fn){
   var _this = this;
   if ( this.window_type === "dialog" ){
      if (this.window_dialogType === "modal"){
         var dialog = this.winManager.modalDialog.pop();
         $(dialog.mask).css("display","none");
         var nCount = this.winManager.modalDialog.length;
         if ( nCount === 0 ){
            this.winManager.activeTopWindow(false);
         }else{
            this.winManager.modalDialog[nCount-1].jwindow.activeWindow(true);
         }
      }else{
         this.winManager.remove(this);
      }
   }else{
      this.winManager.remove(this);
   }
   var animation = this.getAnimation(animiation);
   sFlag = sFlag || "Cancel";
   $(this.dom.window)
      .animate(
         animation,
         300,
         function(){
            _this.destroy();
            if ( _this.onClose ){
               _this.onClose(sFlag);
            }
            if ( fn ){
               fn(_this,sFlag);
            }
         }
      );
};
jsWindow.prototype.getAnimation = function(sAnimation){
   switch(sAnimation){
   case "slideleft":
      return {left:-$(this.dom.window).width() + "px"};
   case "slideright":
      return {left:$(window).width() + "px"};
   case "slideup":
      return {top:-$(this.dom.window).height() + "px"};
   case "slidedown":
      return {top:$(window).height() + "px"};
   case "pop":
      var off = $(this.dom.window).offset();
      var w   = $(this.dom.window).width();
      var h   = $(this.dom.window).height();
      return {left   : off.left + Math.round((w - 10)/2) + "px",
              top    : off.top  + Math.round((h - 10)/2) + "px",
              width  : 10 + "px",
              height : 10 + "px"
              };
   case "fade":
   default:
      return {opacity:0};
   }
};
jsWindow.prototype.destroy = function(){
   var e;
   for ( e in this.dom ){
      if ( this.dom.hasOwnProperty(e) ){
         $(this.dom[e]).remove();
         this.dom[e] = null;
      }
   }
   this.dom = null;
   this.window_restore = null;
};

jsWindow.prototype.offset = function(){
   return $(this.dom.window).offset();
};
jsWindow.prototype.width = function(){
   return $(this.dom.window).width();
};
jsWindow.prototype.height = function(){
   return $(this.dom.window).height();
};

jsWindow.prototype.innerOffset = function(){
   var off1 = $(this.dom.window).offset();
   var off2 = $(this.dom.content).offset();
   return {left:off2.left-off1.left,top:off2.top-off1.top};
};
jsWindow.prototype.innerWidth = function(){
   return $(this.dom.content).width();
};
jsWindow.prototype.innerHeight = function(){
   return $(this.dom.content).height();
};

jsWindow.prototype.setInnerSize = function(w,h){
   var newW = w  + 10, newH = h + 29 + ((this.dom.status_bar.style.display === "none") ? 0 : 20/*status bar height*/);
   
   $(this.dom.window).css({width:newW+"px",height:newH+"px"});
   return this;
};
jsWindow.prototype.bind = function(sFunc,func){
   var arr = sFunc.split(" "),i;
   for ( i = 0; i < arr.length; i ++ ){
      this[arr[i]] = func;
   }
   return this;
};
jsWindow.prototype.hideStatusBar = function(){
   $(this.dom.status_bar).css("display","none");
   $(this.dom.content).css("bottom","5px");
   return this;
};

jsWindow.prototype.sizeTo = function(dw,dh,fnDone){
   var w = $(this.dom.window).width();
   var h = $(this.dom.window).height();
   var pos = $(this.dom.window).position();
   
   var left = pos.left - Math.round(dw / 2);
   var top  = pos.top - Math.round(dh / 2);
   var jwin = this;
   $(this.dom.window).animate(
      {left:left + "px",top:top + "px"},200,
      function(){
         $(this).animate(
            {width:w + dw + "px", height:h + dh + "px"},200,
            function(){
               if ( fnDone ){
                  fnDone(jwin);
               }
            }
         );
      }
   );
};

jsWindow.prototype.customizeStatusbar = function(){
};
//
// Plugin to customize the status bar
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function jsImageWindow(winMgr){
   // passing parameter to parent
   jsWindow.call(this,winMgr);
}
jsImageWindow.prototype             = new jsWindow();
jsImageWindow.prototype.constructor = jsImageWindow;

jsImageWindow.prototype.customizeStatusbar = function(){
   if ( this.dom.status_bar ){
      var _this = this;
      $(this.dom.status_bar)
         .append("<div class=\"status_seperator\"></div>")
         .append("<div class=\"icon icon_coord\"></div>")
         .append($("<div class=\"status_coord\"></div>").each(function(){_this.dom.coordinate = this;}))
         
         .append("<div class=\"status_seperator\"></div>")
         .append("<div class=\"icon icon_select\"></div>")
         .append($("<div class=\"status_select\"></div>").each(function(){_this.dom.coordinate_selection = this;}))
         
         .append("<div class=\"status_seperator\"></div>")
         .append($("<div class=\"status_prompt\"></div>")
                  .append($("<div class=\"progress_mask\"></div>").each(function(){_this.dom.progress_mask = this;}))
                  .append($("<div class=\"progress_text\"></div>").each(function(){_this.dom.progress_text = this;}))
         );
   }
   return this;
};

jsImageWindow.prototype.showCanvasSize = function(s){
   $(this.dom.image_dimension).html(s);
   return this;
};

jsImageWindow.prototype.showCoord = function(s){
   $(this.dom.coordinate).html(s);
   return this;
};

jsImageWindow.prototype.updateProgress = function(percentage,done,text){
   var w = $(this.dom.progress_mask.parentNode).width(),
       h = $(this.dom.progress_mask.parentNode).height();
   var left = Math.round(w * percentage);
   
   if ( done ){
      $(this.dom.progress_mask).css("left","0px");
      if ( text ){
         $(this.dom.progress_text).html(text + " done!");
      }else{
         $(this.dom.progress_text).html("Done!");
      }
   }else{
      $(this.dom.progress_mask)
      .css({"left":left + "px"});
      
      var s = (percentage * 100).toFixed(0);
      if ( text ){
         $(this.dom.progress_text).html(text + "... ... <span style='color:#ff0000'>(" + s + "%)</span>");
      }else{
         $(this.dom.progress_text).html(s + "%");
      }
   }
};
