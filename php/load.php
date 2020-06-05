<?PHP
$base   = '../';
$dir    = 'files/';
$file = $_GET['file']  ;

$content = file_get_contents($base.$dir.$file.'/index.html') ;

$content = preg_replace('/src=(["|\'])(?!http)/',"src=$1$dir$file/",$content);
$content = preg_replace('/href=(["|\'])(?!http)/',"href=$1$dir$file/",$content);

header('Content-Type: text/html');
echo("Ciao") ;
echo($content);
?>
