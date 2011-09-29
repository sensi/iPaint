<?php
$file       = $_POST["file"];
$image_data = $_POST["data"];
$user       = $_POST["user"];

$ip         = $_SERVER["REMOTE_ADDR"];
$ip         = str_replace(".","-",$ip);
$file       = $ip . "_" . $file;

$physical_file = realpath('.') . '/user_data/' . $user . '/' . $file;
//removing the "data:image/png;base64," part
$image_data =  substr($image_data,strpos($image_data,",")+1);
file_put_contents($physical_file, base64_decode($image_data));
echo '{"file":"http://www.jswidget.com/user_data/' . $user . '/' . $file . '"}';
?>
