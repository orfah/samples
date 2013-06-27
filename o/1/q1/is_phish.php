<?php

// returns bool
function is_phish($url) {
    $dbh = new PDO("mysql:host=localhost;dbname=opendns", 'opendns', 'opendns');
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);	

    // md5 the url b/c the db field is limited to 255 chars
    $url = md5($url);
    $stmt = $dbh->prepare("SELECT count(*) FROM phish WHERE url_md5=:url");
    $stmt->execute(array(':url'=>$url));
    $count = $stmt->fetchAll();
    return $count[0][0] == 0 ? false : true;
}

?>
