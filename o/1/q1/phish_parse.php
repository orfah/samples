<?php
$fh = fopen('./verified_online.csv', 'r');
$dbh = new PDO("mysql:host=localhost;dbname=opendns", 'user', 'pass');
$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);	

$stmt = $dbh->prepare("insert into phish set phish_id=:pid, url_md5=:url");
while (($data = fgetcsv($fh)) !== false) {
    $pid = $data[0];
    $url = $data[1];
    $md5 = md5($url);
    $params = array(':pid'=>$pid, ':url'=>$md5);
    $stmt->execute($params);
}
?>
