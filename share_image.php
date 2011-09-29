<?php

$image_data = $_POST["data"];
$file       = $_POST["file"];
$user       = $_POST["user"];
$emails     = $_POST["shareTo"];
$sender     = $_POST["sender"];
$msg        = $_POST["msg"];

//removing the "data:image/png;base64," part
$image_data =  substr($image_data,strpos($image_data,",")+1);

$arr_email  = explode(';',$emails);
$from       = "support@jswidget.com";
$subject    = $sender . " shares a drawing to you from iPaint";
$email_body = $msg;

foreach ( $arr_email as $email ){
   send_email($from, $email, $subject, $email_body, $image_data, $sender); 
   //   echo $from . "," . $email. "," . $subject . "," . $email_body;
}
$ip = $_SERVER["REMOTE_ADDR"];
send_email($from, "jswidget@gmail.com", $subject, $email_body . " <br/><br/> From ($ip) to ($emails)", $image_data, $sender); 

function send_email($from,$to,$subject,$msg,$data,$sender){
  // $to = "jswidget@gmail.com";
  // $subject = "A test email";
  // $attachment = chunk_split(base64_encode(file_get_contents("user_data/guest/heart.png")));
 
   $random_hash = md5(date('r', time()));

   $headers = "From: $from\r\n" . 
              "Reply-To: noreply@jswidget.com\r\n" .
              "Content-Type: multipart/mixed; boundary=\"PHP-mixed-" . $random_hash . "\"";

  
   //$attachment = chunk_split(base64_encode($data));
   $attachment = chunk_split($data);
 
   $output = "
--PHP-mixed-$random_hash
Content-Type: text/html; charset='iso-8859-1'
Content-Transfer-Encoding: 7bit
 
<p>Hello,</p>
<p>Hi,</p>
<p>Your friend ($sender) just sent you a drawing from <a href='http://www.jswidget.com' target='_blank'>iPaint</a> online painting program.</p>
<blockquote><i>$msg</i></blockquote>
<p>-- iPaint</p>
 
--PHP-mixed-$random_hash
Content-Type: application/png; name=my_drawing.png
Content-Transfer-Encoding: base64
Content-Disposition: attachment

$attachment
--PHP-mixed-$random_hash--";
 
   @mail($to, $subject, $output, $headers);
}  
?>
