<?php
$current_time    = time();

$CommentFile = realpath('.') . '/user_data/comments.xml';

$xml = new DomDocument('1.0','utf-8');

if ( file_exists($CommentFile) ){
   $xml->load($CommentFile);
	$root = $xml->firstChild;
	$total = $xml->getElementsByTagName("comment")->length;
   $comments = array();
      
	$last_child = $root->lastChild;
	if ( $last_child ){
	    $comments[] = getComment($last_child);
	   
	   $previous_sibling = $last_child -> previousSibling;
	   
	   while ( $previous_sibling ){
	      $comments[] = getComment($previous_sibling);
	      $previous_sibling = $previous_sibling -> previousSibling;
	   }
	} 
   echo json_encode(array("total"=>$total,"comments"=>$comments));
}

function getComment($comment){
   $time    = $comment->getAttribute("timestamp");
   $author  = $comment->getAttribute("author");
   $ip      = $comment->getAttribute("ip");
   $subject = $comment->firstChild->nodeValue;
   $msg     = $comment->lastChild->nodeValue;
   $msg     = str_replace(array("\r","\n"),"<br />", $msg);
   $msg     = str_replace(array("[[","]]"),array("<",">"), $msg);
   
   $time    = ago(time() - $time*1);
/*   
   return '<li class="comment">' .
          '   <div class="subject">' . $subject . '</div>' .
          '   <div class="title"><span class="author">' . $author . '</span>&nbsp;&nbsp;<span class="date">' . $time . '</span></div>' .
          '   <div class="message">' .
          '      <div class="text">' . $msg . '</div>' .
          '   </div>' .
          '</li>';
*/
   return '<li class="comment">'.
          '   <img src="style/comment.png" class="avatar">'.
          '   <span class="user-name author">' . $author . '</span> <br>' .
          '   <span class="comment-html">'.
          '      <strong>' . $subject . '</strong><br/><br/>' . $msg . 
          '   </span><br>'.
          '   <a class="comment-time">' . $time . '</a>'.
          '</li>';

}


function getStr($number,$unit){
	return ($number == 0) ? '' : ( $number . ( ($number == 1) ? (' ' . $unit) : (' ' . $unit . 's') ) );
}

function ago($timeSpan,$precise = false){
	if ( $timeSpan < 60 ){
		$second = $timeSpan;
		return getStr($second,'second') . ' ago';
	}else{
		$second = $timeSpan % 60;
		$minute = floor(($timeSpan - $second) / 60);
		if ( $minute < 60 ){
			return getStr($minute,'minute') . ' ' . getStr($second,'second') . ' ago';
		}else{
			$min  = $minute % 60;
			$hour = floor(($minute - $min) / 60);
			if ( $hour < 24 ){
				
				return ($precise) ? (getStr($hour,'hour') . ' ' . getStr($min,'minute') . ' ' . getStr($second,'second') . ' ago')
				                  : (getStr($hour,'hour') . ' ' . getStr($min,'minute') . ' ago');
			}else{
				$hr = $hour % 24;
				$days = floor(($hour - $hr) / 24);
				return ($precise) ? (getStr($days,'day') . ' ' . getStr($hr,'hour') . ' ' . getStr($min,'minute') . ' ' . getStr($second,'second') . ' ago')
				                  : (($days == 1) ? 'yesterday' : $days . ' days' . ' ago');
			}
		}
	}
}

?>
 
 
 