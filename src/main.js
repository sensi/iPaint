//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : none
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
var iPhone = navigator.userAgent.indexOf("iPhone") !== -1 ;
var iPod   = navigator.userAgent.indexOf("iPod") !== -1 ;
var iPad   = navigator.userAgent.indexOf("iPad") !== -1 ;
var iOS    = iPhone || iPad || iPod ;

google.load("search", "1");

jQuery(document).ready(function(){
   var canvas_width  = 600;
   var canvas_height = 400;
   var foreColor     = "#000000", backColor = "#ffffff";
   var nLineWidth    = 3;
   var nOpacity      = 0.75;
   
   //
   // Check if target browser supports canvas element
   //
   ////////////////////////////////////////////////////////
   if ( !supports_canvas() ){
      $("#not_support_canvas").css("display","");
      $("#ipaint_frame").css("display","none");
      $("#history").css("display","none");
      
      return;
   }
   
   $(".image_unit")
      .bind("change",
            function(){
               $(".image_unit").val($(this).val());
            });
   
   //
   // Initialize color picker control
   //
   ////////////////////////////////////////////////////////
   var color_picker = new jsColorPicker()
      .attachColorPicker(document.getElementById('fore_color'), foreColor, false,
         function(color){
            myApp.foreColor(color).update();
         })
      .attachColorPicker(document.getElementById('back_color'), backColor, false,
         function(color){
            myApp.backColor(color).update();
         });

   //
   // Initialize opacity slider control
   //
   ////////////////////////////////////////////////////////
   var opacitySlider = new jsSliderControl(0,1,2,100)
                     .init(document.getElementById("opacity_slider"));
   opacitySlider.customTip = function(r){
      return Math.round(r * 100) + "%";
   };
   opacitySlider.onDrag = function(s){
      myApp.stopLogging();
      myApp.opacity(s).update();
      myApp.startLogging();
   };
   opacitySlider.onDragEnd = function(s){
      myApp.opacity(s).update();
   };

   //
   // Create paint canvas application
   //
   ////////////////////////////////////////////////////////

   var myApp = new iPaintApp("ipaint_frame",canvas_width,canvas_height,
                                 null,
                                 null,
                                 function trackingCavasSize(canvas,w,h){
                                       $("#ruler_canvas_width").val(w);
                                       $("#ruler_canvas_height").val(h);
                                 },
                                 function actionComplete(p,o){
                                    var s = [],a;
                                    
                                    for ( a in o ){
                                       s.push(a);
                                    }
                                 }
                               );
   myApp.stopLogging();
   
   myApp.setOpacitySlider(opacitySlider)
        .setColorPicker(color_picker)
        .foreColor(foreColor)
        .backColor(backColor)
        .lineWidth(nLineWidth)
        .opacity(nOpacity)
        .canvasBackground("white");
          
   // Restore data from localStorage if there is any
   initGUI();
   myApp.setAction("pencil");

   myApp.startLogging();
   myApp.initHistory();
   myApp.synchronizeHistory();

   $("#tb_menu .new-image").bind("click",function(){myApp.openNewImageDialog();});
   $("#tb_menu .save-image").bind("click",function(){myApp.openSaveImageDialog();});
   $("#tb_menu .email-image").bind("click",function(){myApp.openShareImageDialog();});
   $("#tb_menu .clear-image").bind("click",function(){myApp.clearImage();});
   $("#tb_menu .image-url").bind("click",function(){myApp.openURLDialog();});
   $("#tb_menu .image-gallery").bind("click",function(){myApp.openGalleryDialog();});
   $("#tb_menu .about").bind("click",function(){myApp.openAboutDialog();});
            
   $("#dlg_save_image input[name=image_format]")
      .bind("click",
            function(){
               var ext = $(this).val();
               var sFile = $.trim($("#dlg_save_image input[name=image_file]").val());
               sFile = makeFile(sFile,ext);
               $("#dlg_save_image input[name=image_file]").val(sFile).focus();
            });

   //
   // setup history box
   //
   ////////////////////////////////////////////////////////
   $("#history .title").each(
      function(){
         Drag.init(this,this.parentNode);
         var l = document.body.clientWidth - 230;
         var t = 150;
         $(this.parentNode).css({left:l + "px",top:t + "px"});
      });

   $("label").css("cursor","pointer");

   //
   // Bind event handler to both tools icon and shape icon
   //
   ////////////////////////////////////////////////////////
   $(".mi")
      .bind("mouseover",
            function(){
               if ( this.className.indexOf("menu_item_active") === -1 ){
                  $(this).removeClass("menu_item menu_item_active").addClass("menu_item_over");
               }
            })
      .bind("mouseout",
            function(){
               if ( this.className.indexOf("menu_item_active") === -1 ){
                  $(this).removeClass("button_19x18_selected menu_item_over").addClass("menu_item");
               }
            })
      .bind("click",
            function(){
               $(".mi").removeClass("menu_item_active menu_item_over menu_item").addClass("menu_item");
               $(this).addClass("menu_item_active");
            });

   //
   // Bind event handler to history tool bar
   //
   ////////////////////////////////////////////////////////
   $("#history .toolbar .tool")
      .bind("mouseover",
            function(){
               $(this).addClass("over");
            })
      .bind("mouseout",
            function(){
               $(this).removeClass("over");
            })
      .bind("click",
            function(){
               var name = $(this).attr("name");
               switch(name){
               case "undo" : myApp.undo(); break;
               case "redo" : myApp.redo(); break;
               case "remove": myApp.removeHistory(); break;
               case "clear": myApp.clearImage(); break;
               case "view" : myApp.viewHistory();break;
               }
            });

      

   //
   // Bind event handler to canvas background
   //
   ////////////////////////////////////////////////////////
   $(".canvas_bg")
      .bind("mouseover",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){return;}
               $(this).addClass("over");
            })
      .bind("mouseout",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){return;}
               $(this).removeClass("over");
            })
      .bind("click",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               $(".canvas_bg").removeClass("selected");
               $(this).removeClass("over").addClass("selected");

               var name = $(this).attr("name");
               if ( name === "font" ){
                  showFontOptions();
               }else{
                  hideFontOptions();
               }
               switch(name){
               case "white": 
               case "gray": 
               case "black": 
               case "transparent": 
               case "background":   
                  myApp.canvasBackground(name);
                  break;
               default: myApp.setAction(name);break;
               }
            });

   //
   // Bind event handler to canvas background
   //
   ////////////////////////////////////////////////////////
   $(".font_family").change(function(){
      myApp.fontName($(this).val());
   });
   $(".font_size").change(function(){
      myApp.fontSize($(this).val());
   });
   $(".font_option")
      .bind("mouseover",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){return;}
               $(this).addClass("over");
            })
      .bind("mouseout",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){return;}
               $(this).removeClass("over");
            })
      .bind("click",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){
                  $(this).removeClass("over selected");
               }else{
                  $(this).removeClass("over").addClass("selected");
               }

               var name = $(this).attr("name");
               switch(name){
               case "bold": 
                  var old = myApp.fontWeight();
                  if ( old === "normal" ){
                     myApp.fontWeight("bold");
                  }else{
                     myApp.fontWeight("normal");
                  }
                  break;
               case "italic": 
                  var old = myApp.fontStyle();
                  if ( old === "normal" ){
                     myApp.fontStyle("italic");
                  }else{
                     myApp.fontStyle("normal");
                  }
                  break;
               }
            });
   //
   // Bind event handler to both tools icon and shape icon
   //
   ////////////////////////////////////////////////////////
   $(".canvas_tool_shape")
      .bind("mouseover",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){return;}
               $(this).addClass("over");
            })
      .bind("mouseout",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               if ( $(this).hasClass("selected") ){return;}
               $(this).removeClass("over");
            })
      .bind("click",
            function(){
               if ( $(this).hasClass("disabled") ){return;}
               $(".canvas_tool_shape").removeClass("selected");
               $(this).removeClass("over").addClass("selected");

               var refer_id = $(this).attr("refer");
               var refer_from = this.parentNode.refer_from;
               var _this = this;
               if ( refer_id ){
                  if ( $("#" + refer_id).css("display") !== "none" ){
                     $("#" + refer_id).css({display:"none"})
                     .each(function(){
                        this.refer_from = _this;
                     });
                  }else{
                     $(".referee").css({display:"none"});
                     $("#" + refer_id)
                     .css({
                        display:"",
                        left:$(this).offset().left + "px",
                        top:$(this).offset().top + $(this).height() + "px"
                     }).each(function(){
                        this.refer_from = _this;
                     });
                  }
               }else{
                  $(".referee").css({display:"none"});
               }
               if ( refer_from ){
                  $(refer_from).attr("title",$(this).attr("title"));
                  $(refer_from).attr("name",$(this).attr("name"));
                  $(refer_from).attr("className",$(this).attr("className"));
               }
               var name = $(this).attr("name");
               if ( name === "font" ){
                  showFontOptions();
               }else{
                  hideFontOptions();
               }
               switch(name){
               default: myApp.setAction(name);break;
               }
            });

   //
   // Bind event handler to line width selector
   //
   ////////////////////////////////////////////////////////
   $(".line-width")
      .bind("mouseover",
            function(){
               if ( !$(this).hasClass("selected") ){
                  $(this).addClass("over");
               }
            })
      .bind("mouseout",
            function(){
               if ( !$(this).hasClass("selected") ){
                  $(this).removeClass("over");
               }
            })
      .bind("click",
            function(){
               if ( !$(this).hasClass("selected") ){
                  $(this).removeClass("over");
               }
               $(".line-width").removeClass("selected");
               $(this).addClass("selected");

               //myApp.rubber($(this).attr("name"));
               setLineWidth(parseInt($(this).attr("name").split("_")[1]));
            });

   $(".input_line_width")
      .bind("blur",
            function(){
               var s = parseInt($.trim($(this).val()));
               setLineWidth(s);
            }).val(myApp.lineWidth());


   //
   // Bind event handler to b/f color swapper
   //
   ////////////////////////////////////////////////////////
   $(".swap_color")
      .bind("click",
            function(){
               var fColor = $("#fore_color").attr("current_color");  
               var fSlider = $("#fore_color").attr("slider_pos");  
               var bColor = $("#back_color").attr("current_color");  
               var bSlider = $("#back_color").attr("slider_pos");  
               $("#fore_color").css("backgroundColor",bColor).attr({"current_color":bColor,"slider_pos":bSlider});
               $("#back_color").css("backgroundColor",fColor).attr({"current_color":fColor,"slider_pos":fSlider});
               myApp
               .foreColor(bColor)
               .backColor(fColor)
               .update();
            });

   //
   // Bind event handler to outline checkbox
   //
   ////////////////////////////////////////////////////////
   $("#shape_with_outline")
      .bind("click",
            function(){
               if (this.checked){
                  myApp.outline("solid");
               }else{
                  myApp.outline("none");
               }
               myApp.update();
            }).attr("checked",true);

   //
   // Bind event handler to fill checkbox
   //
   ////////////////////////////////////////////////////////
   $("#shape_with_fill")
      .bind("click",
            function(){
               if (this.checked){
                  myApp.fillMode("solid");
               }else{
                  myApp.fillMode("none");
               }
               myApp.update();
            }).attr("checked",true);

                    
   //
   // Bind event handler to show/hide ruler checkbox
   //
   ////////////////////////////////////////////////////////
   $("#show_hide_ruler")
      .bind("click",
            function(){
               if ( this.checked ){
                  myApp.showRuler(true);
               }else{
                  myApp.showRuler(false);
               }
            }).attr("checked",true);

   //
   // Bind event handler to show/hide grid checkbox
   //
   ////////////////////////////////////////////////////////
   $("#show_hide_grid")
      .bind("click",
            function(){
               if ( this.checked ){
                  myApp.showGrid(true);
               }else{
                  myApp.showGrid(false);
               }
            }).attr("checked",false);


   //
   // Bind event handler to unit radioboxes
   //
   ////////////////////////////////////////////////////////
   $("input[name=ruler_unit]").css("cursor","pointer")
      .bind("click",
         function(){
            myApp.setUnit($(this).attr("value"));
         });
   $("input[name=ruler_unit][value=px]").attr("checked",true);

   //
   // Bind event handler to unit radioboxes
   //
   ////////////////////////////////////////////////////////
   $("input[name=canvas_background]").css("cursor","pointer")
      .bind("click",
            function(){
               myApp.canvasBackground($(this).attr("value"));
            });
   $("input[name=canvas_background][value=white]").attr("checked",true);

   //
   // Bind event handler to canvas size
   //
   ////////////////////////////////////////////////////////
   $("#ruler_canvas_width").val(canvas_width)
      .bind("blur",
            function(){
               var v = myApp.toPixel(parseFloat($(this).val()),myApp.getUnit());
               if ( v !== myApp.width ){
                  myApp.sizeTo(parseFloat($(this).val()),null);
               }
            });
         
   $("#ruler_canvas_height").val(canvas_height)
      .bind("blur",
            function(){
               var v = myApp.toPixel(parseFloat($(this).val()),myApp.getUnit());
               if ( v !== myApp.height ){
                  myApp.sizeTo(null,parseFloat($(this).val()));
               }
            });

   window.onresize = function(){
      var s = $("#tool_bar").attr("toolbar");
      //s = (( s === "dock" ) ? "float" : "dock");
      myApp.setupFrame({toolbar:s});
   };
            
      
   $(".image_cell_big .close")
      .bind("click",
            function(){
               $(".image_cell_big")
               .animate(
                  {
                     left    : $(".image_cell_big").attr("src_left"),
                     top     : $(".image_cell_big").attr("src_top"),
                     width   : $(".image_cell_big").attr("src_width"),
                     height  : $(".image_cell_big").attr("src_height"),
                     opacity : 0.1
                  },300,
                  function(){
                     $(this).css("display","none");
                  }
               );         
            });
   $("#toolbar_close")
      .attr("title","Click here to hide toolbar")
      .bind("click",
            function(){
               if ( $(this).hasClass("expand") ){
                  $("#tool_bar")
                     .animate({height:"5px"},200,function(){
                        var s = $(this).attr("toolbar");
                        $("#toolbar_close").removeClass("expand").addClass("collapse").attr("title","Click here to show toolbar");
                        myApp.setupFrame({toolbar:s});
                     });
               }else{
                  $("#tool_bar")
                     .animate({height:"92px"},200,function(){
                        var s = $(this).attr("toolbar");
                        $("#toolbar_close").removeClass("collapse").addClass("expand").attr("title","Click here to hide toolbar");
                        myApp.setupFrame({toolbar:s});
                     });
               }
            });
                              
   $("#show_history").click(function(){
      myApp.showHistory();
   });
   $("#clear_history").click(function(){
      myApp.clearHistory();
   });
   
   $("#tb_comment .add_comment").click(function(){
      var opened = $(this).data("opened");
      if ( !opened ){
         showComments();
      }else{
         hideComments();
      }
   });
   $("#comment_pane div.close_button").click(function(){
      hideComments();
   });
   
   $("#tb_twitter .following").click(function(){
      window.open("http://www.twitter.com/jswidget","_blank");
   });

   $("#tb_blog .myblog").click(function(){
      window.open("http://www.jswidget.com/blog","_blank");
   });
   
   
   $(window).unload(function(){
      myApp.storeHistory();
   });
   
   function setLineWidth(s){
      if ( !(s === "" || isNaN(s) ) ){
         myApp.lineWidth(Math.round(s)).update();
         $("#tb_size .line-width").removeClass("selected");
         $("#tb_size [name='size_" + s + "px']").addClass("selected");
         $("#tb_size .input_line_width").val(s);
      }
   }
   function initGUI(){
      setLineWidth(myApp.lineWidth());
   }
   
   function showFontOptions(){
      $(".font_panel").css("display","");
      $("#tb_font").animate({width:"118px"},300);
   }
   function hideFontOptions(){
      $("#tb_font").animate({width:"0px"},300,function(){$(".font_panel").css("display","none");});
   }
});
		

function supports_canvas() {
   return !!document.createElement('canvas').getContext;
}

function supports_storage(){
   try{
      return 'localStorage' in window && window['localStorage'] !== null;
   }catch(e){
      return false;
   }
}
function hidePoppedTool(){
   $(".referee").css({display:"none"});
} 

function enableIcon(){
   var i;
   for ( i = 0; i < arguments.length; i ++ ){
      $("." + arguments[i]).removeClass("disabled");
   }
}
function disableIcon(){
   var i;
   for ( i = 0; i < arguments.length; i ++ ){
      $("." + arguments[i]).addClass("disabled").removeClass("button_19x18_selected");
   }
}

function showComments(){
   var icon_off = $("#tb_comment .add_comment").offset();
   var icon_w   = $("#tb_comment .add_comment").width();
   var icon_h   = $("#tb_comment .add_comment").height();
   
   var w = 800;
   var left = icon_off.left + icon_w/2 - w/2;
   var top  = icon_off.top + icon_h;
   var h = $(window).height() - 100 - top;
   
   if ( (left + w) > $(window).width() ){
      left = $(window).width() - w - 30;
   }
   loadComments();
   
   $("#comment_pane")
      .css({left:icon_off.left + icon_w/2 + "px",
            top:top + "px",
            width:"0px",height:"0px",display:"",
            opacity:0,display:""})
      .animate(
         {
            left:left + "px",
            width:w+"px",
            height:h+"px",
            opacity:1
         },300,function(){
            $("#tb_comment .add_comment").data("opened",true).removeClass("closed").addClass("opened");
         }
      );            
}

function hideComments(){
   var icon_off = $("#tb_comment .add_comment").offset();
   var icon_w   = $("#tb_comment .add_comment").width();
   var icon_h   = $("#tb_comment .add_comment").height();
   $("#comment_pane")
      .animate(
         {
            left:icon_off.left + icon_w/2 + "px",
            width:"0px",
            height:"0px",
            opacity:0
         },300,function(){
            $("#tb_comment .add_comment").data("opened",false).removeClass("opened").addClass("closed");
            $(this).css({"display":"none"});
         }
      );            
}
function loadComments(){
   $.ajax({
      url:"./read_comment.php",
      dataType:"json",
      type:"POST",
      cache:false,
      success:function(data){
            $("#comment-list li.comment").remove();
            var i;
            for ( i = 0; i < data.comments.length; i ++ ){
               $("#comment-list li:last-child").before(data.comments[i]);
            }
      },
      error:function(s){
      }
   });
}

function submitMessage(){
   var data = {
      name    : $.trim($("#name").val()),
      subject : $.trim($("#subject").val()),
      message : $.trim($("#message").val())
   };
   
   if ( data.name == "" ){
      $("#error").html("Please enter your name");
      $("#name").focus();
      return;
   }
   if ( data.subject == "" ){
      $("#error").html("Please enter subject");
      $("#subject").focus();
      return;
   }
   if ( data.message == "" ){
      $("#error").html("Please enter your message");
      $("#message").focus();
      return;
   }
   
   $.ajax({
      url:"add_comment.php",
      data:data,
      dataType:"json",
      type:"POST",
      cache:false,
      success:function(data){
         $("#comment-list li:first-child").before(data.comment);
         $("#comment-list").scrollTop(0);
      },
      error:function(s){
      }
   });
}
