<?php
$file       = $_POST["file"];
$image_data = $_POST["data"];
$user       = $_POST["user"];

//$ip         = $_SERVER["REMOTE_ADDR"];
//$ip         = str_replace(".","-",$ip);
$file       = $file;

$dir = __DIR__ . '/../../../drawings/' . $user . '/';
$writeFile = $dir . $file;
if (!file_exists($dir)) {
	mkdir($dir,0777,true);
}
//removing the "data:image/png;base64," part
$image_data =  substr($image_data,strpos($image_data,",")+1);
file_put_contents($writeFile, base64_decode($image_data));
echo '{"file":"/drawings/' . $user . '/' . $file . '"}';
exit();
?>
