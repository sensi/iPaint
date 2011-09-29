<?php
$date_value    = time();

$author_value  = processText($_POST["name"]);
$subject_value = processText($_POST["subject"]);
$msg_value     = processText($_POST["message"]);

if ( $author_value == "" || $subject_value == "" || $msg_value == "" ){
   echo json_encode(
	   array(
         "state"   =>  -1,
         "reason"  =>  "This script can not be called directly from your browser"
	   )
   );
}else{
   $ip            = $_SERVER["REMOTE_ADDR"];
   $CommentFile = realpath('.') . '/user_data/comments.xml';

   $total = addComment($CommentFile,$date_value,$author_value,$subject_value,$msg_value,$ip);

   echo json_encode(
	   array(
         "total"   =>    $total,   
         "comment" =>    '<li class="comment">'.
                         '   <img src="style/comment.png" class="avatar">'.
                         '   <span class="user-name author">' . $author_value . '</span> <br>' .
                         '   <span class="comment-html">'.
                         '      <strong>' . $subject_value . '</strong><br/><br/>' . $msg_value . 
                         '   </span><br>'.
                         '   <a class="comment-time">' . ago(time() - $date_value*1) . '</a>'.
                         '</li>'

	   )
   );
}

function addComment($CommentFile,$date_value,$author_value,$subject_value,$msg_value,$ip){
	$xml = new DomDocument('1.0','utf-8');

	if ( file_exists($CommentFile) ){
	   $xml->load($CommentFile);
		$root = $xml->firstChild;
	}else{
		$root = $xml->appendChild($xml->createElement("comments"));
	}
	
	$comment = $xml->createElement("comment");
	$root->appendChild($comment);

	// Add date attribute
	$attr_date = $xml->createAttribute("timestamp");
	$comment->appendChild($attr_date);
	
	$value = $xml->createTextNode($date_value);
	$attr_date->appendChild($value);

	// Add author attribute
	$attr_author = $xml->createAttribute("author");
	$comment->appendChild($attr_author);

	$value = $xml->createTextNode($author_value);
	$attr_author->appendChild($value);

	// Add author ip address
	$attr_ip = $xml->createAttribute("ip");
	$comment->appendChild($attr_ip);
	$value = $xml->createTextNode($ip);
	$attr_ip->appendChild($value);
	
	// add subject child node
	$subject = $xml->createElement("subject");
	$comment->appendChild($subject);
	$value = $xml->createTextNode($subject_value);
	$subject->appendChild($value);

   // add message child node
	$msg = $xml->createElement("message");
	$comment->appendChild($msg);
	$value = $xml->createTextNode($msg_value);
	$msg->appendChild($value);
	
	$xml->save($CommentFile);
   
   return $xml->getElementsByTagName("comment")->length;
}	

function processText($s){
   $s = str_replace(array('&'    , '<'   , '>'   , "\\'"    , '\\"'),
                    array('&amp;', '&lt;', '&gt;', "&#39;", '&quot;'),
                    $s);
   return $s;
}

function getStr($number,$unit){
	return ($number == 0) ? '' : ( $number . ( ($number == 1) ? (' ' . $unit) : (' ' . $unit . 's') ) );
}

function ago($timeSpan,$precise = false){
	if ( $timeSpan < 60 ){
		$second = $timeSpan;
		return ($second == 0) ? "Just now" : getStr($second,'second') . ' ago';
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