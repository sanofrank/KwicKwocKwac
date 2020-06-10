<?php
$dir    = '../files/';
$files = scandir($dir);

$out = array() ;


for($i = 0; $i < count($files); $i++) {
	if (is_dir($dir.$files[$i]) &&  substr($files[$i],0,1)!=='.') {
		$out[] = array(
			'label' => $files[$i],
			'url' => $files[$i]
		) ; 
	}
}



header('Content-Type: application/json');
echo(json_encode($out));
//echo(json_encode($files)) 
?>