<?PHP
$base   = '../';
$dir    = 'files/';

$data = json_decode(file_get_contents("php://input"),true) ;
$file = $data['filename'] ;
$out = $data['content'] ;

$result = false;
if ($file !== "") {
	if (!file_exists($base.$dir.$file)) {
		mkdir($base.$dir.$file, 0777, true);
	}
	$path = $base.$dir.$file.'/index.html' ; 

	$content = str_replace("$dir$file","",$out);
	$content = str_replace("$dir$file","",$content);

	if ($content!=="") {
		$result = file_put_contents($path,$content) ;
	}
}

if (!$result) {
	echo "file $filename NON salvato." ;
} else {
	echo "file $file salvato correttamente in $path" ;
}

?>
