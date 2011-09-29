//-----------------------------------------------------------------------------------------------------------------------------------------
//
//        class : History
//
// parent class : none
// last updated : 02/23/2011
//       author : Yubo Dong
//        email : jswidget@gmail.com
//
// Copyright @2011. All rights reserved.
//
//-----------------------------------------------------------------------------------------------------------------------------------------
function History(app){
   //
   // Array to store all the history entries
   this.history = [];
   
   //
   // Always point to current history item
   this.currentItem = -1;
   
   //
   // Flag to indicate if history should be stored
   this.stop = true;
   
   //
   // The main app
   this.paintApp = app;

}

History.prototype.init = function(){
   // Always make sure we have basic attribute setting stored
   var base_attr = window.localStorage.getItem("baseattr");
   if ( !base_attr ){
      window.localStorage.setItem("baseattr",this.paintApp.getAttributeString());
   }
   return this;
};

History.prototype.isLogging = function(){
   return (this.stop === false);
};

History.prototype.stopLogging = function(){
   this.stop = true;
};
History.prototype.startLogging = function(){
   this.stop = false;
};
History.prototype.reset = function(){
   //
   // Remove all the DOM elements from the history list
   // to avoid memory leaking
   var i;
   for ( i = 0; i < this.history.length; i ++ ){
      $("#history_" + i).remove();
   }
   
   //
   // Clear all history entries
   this.history = [];
   
   this.currentItem   = -1;
   
   return this.init();
};

History.prototype.getNumOfEntries = function(){
   var nTotal = window.localStorage.getItem("totalentry");
   if ( nTotal ){
      nTotal = parseInt(nTotal,10);
   }else{
      nTotal = 0;
   }
   return nTotal;
};

History.prototype.synchronizeHistory = function(){
   var i, nTotal = this.getNumOfEntries();
   this.stopLogging();
   this.currentItem = 0;
   this.history = [];
   for ( i = 0; i < nTotal; i ++ ){
      var s = window.localStorage.getItem("hist_" + i);
      if ( s ){
         s = s.split("@");
         this.currentItem = this.history.length;
         this.history.push({label:s[0],data:s[1]});
         this.addToList(s[0],s[1]);
      }         
   }
   this.paintApp.restoreHistory();
};

History.prototype.addToList = function(sLabel,data){
   var _this = this;
   $("#history .content div").removeClass("selected disabled");
   $("#history .content").append(
      // This is the DOM element for the history entry.
      $("<div></div>")
         .html(sLabel)
         .data("index",this.currentItem)
         .css("cursor","pointer")
         .attr({"id":"history_" + this.currentItem,"index":this.currentItem})
         .addClass("item selected")
         .bind("click",
            function(){
               var index = $(this).data("index");
               
               _this.moveTo(index);
               _this.paintApp.restoreHistoryTo(index + 1);
            }
         )
   ).scrollTop(2000);
};


History.prototype.add = function(sLabel,data){
   if ( this.stop ){ return this; }
   
   var i;
   
   if ( this.currentItem !== -1 ){
      // if this.currentItem is not point to last entry, the rest of the entries will be removed.
      for ( i = this.history.length - 1; i > this.currentItem ; i -- ){
         $("#history_" + i).remove();
         window.localStorage.removeItem("hist_" + i);
         this.history.splice(i,1);
      }
   }
   
   this.currentItem = this.history.length;
   this.history.push({label:sLabel,data:data});
   
   window.localStorage.setItem("hist_" + this.currentItem,sLabel + "@" + data);
   window.localStorage.setItem("totalentry",this.history.length);
   this.addToList(sLabel,data);
};

History.prototype.moveTo = function(index){
   $("#history .content div").removeClass("selected disabled");
   $("#history_" + index).removeClass("disabled").addClass("selected");
   
   var i;
   for ( i = index + 1; i < this.history.length; i ++ ){
      $("#history_" + i).removeClass("selected").addClass("disabled");
   }
   this.currentItem = index;
   return;
};

History.prototype.discardDisabled = function(){
   var i, count = 0;
   for ( i = this.currentItem + 1; i < this.history.length; i ++, count ++ ){
      key = "hist_" + i;
      window.localStorage.removeItem(key);
   }
   if ( count > 0 ){
      var nTotal = this.getNumOfEntries();
      window.localStorage.setItem("totalentry", nTotal - count);
   }
};
History.prototype.undo = function(){
   if ( this.currentItem > 0 ){
      var index = this.currentItem - 1;
      this.moveTo(index);
      this.paintApp.restoreHistoryTo(index + 1);
   }
};

History.prototype.redo = function(){
   if ( this.currentItem >= 0 && this.currentItem < this.history.length - 1 ){
      var index = this.currentItem + 1;
      this.moveTo(index);
      this.paintApp.restoreHistoryTo(index + 1);
   }
};
History.prototype.removeEntry = function(){
   if ( this.currentItem > 0 ){
      key = "hist_" + this.currentItem;
      window.localStorage.removeItem(key);
      var nTotal = this.getNumOfEntries();
      window.localStorage.setItem("totalentry",nTotal - 1);
      var i;
      $("#history_" + this.currentItem).remove();
      
      for ( i = this.currentItem + 1; i < nTotal; i ++ ){
         $("#history_" + i)
            .attr({"id":"history_" + (i-1),"index":(i-1)})
            .data("index",i-1);

         var s = window.localStorage.getItem("hist_" + i);
         window.localStorage.setItem("hist_" + (i-1),s);
      }
      this.history.splice(this.currentItem,1);
  
      var nIndex;
      if ( this.currentItem === this.history.length ){
         nIndex = this.currentItem - 1;
         this.moveTo(nIndex);
         this.paintApp.restoreHistoryTo(nIndex + 1);
      }else{    
         nIndex = this.currentItem;
         this.moveTo(nIndex);
         this.paintApp.restoreHistoryTo(nIndex + 1);
      }         
   }
};