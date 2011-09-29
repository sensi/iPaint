<?php
if ( !isAjax() ){
   echo '{"status":-2,"reason":"Invalid request"}';
}else{
   $user       = $_POST["user"];

   $dir = realpath('.') . '/user_data/' . $user . "/";

   if ( is_dir($dir) ){
      $files = scandir_by_mtime($dir);
      echo '{"status":0,"domain":"http://test.jswidget.com/user_data/","user":"' . $user .'","images":[';
      $index = 0;

      foreach($files as $key=>$sub_file){
         if ($index > 0 ){
            echo ',';
         }
         list($width, $height) = getimagesize($dir . $sub_file["file"]);
         echo '{"url":"' . $sub_file["file"] . '",';
         echo '"date":"' . $sub_file["date"] . '",';
         echo '"width":' . $width . ',';
         echo '"height":' . $height . '}';
         $index ++;
      }
      echo ']}';
   }else{
      echo '{"status":-1,"reason":"' . $dir .'"}';
   }
}
function scandir_by_mtime($folder){
   $dircontent = scandir($folder);
   $arr = array();
   foreach($dircontent as $filename) {
      if ($filename != '.' && $filename != '..') {
         if (filemtime($folder.$filename) === false) return false;

         $ext = strtolower(substr($filename, strrpos($filename, '.') + 1));
         $ip = strtolower(substr($filename, 0, strrpos($filename, '_')));
         $ipArray = explode("-",$ip);
         
         if ( $ext == "jpg" || $ext == "png" ){
            $dat = filemtime($folder.$filename);
            for ( $i = 0; $i < count($ipArray); $i ++ ){
               if ( strlen($ipArray[$i]) == 1 ){
                  $ipArray[$i] = "00" . $ipArray[$i];
               }
               if ( strlen($ipArray[$i]) == 2 ){
                  $ipArray[$i] = "0" . $ipArray[$i];
               }
            }
            $dat1 = date("m/d/Y H:i", filemtime($folder.$filename));
            $arr[$dat."_".implode($ipArray)] = array("file"=>$filename,"date"=>$dat1);
         }
      }
   }
   if (!ksort($arr)) return false;
   $arr = array_reverse($arr);
   return $arr;
}
function isAjax() {
   return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
          ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest'));
}
 
?>
