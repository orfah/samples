<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<title>Phishing Site Check</title>
		<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/combo?3.2.0/build/cssreset/reset-min.css&3.2.0/build/cssfonts/fonts-min.css&3.2.0/build/cssgrids/grids-min.css"> 
        <link rel="stylesheet" type="text/css" href="/opendns/q2/css/domain_logger.css">
	</head>
	<body>
        <div class="body">
            <div id="main-container">
<?php
include './is_phish.php';
$in = get_input();
if ($in['url'] != '') {
    if (is_phish($in['url'])) {
        ?>
        <div class="error"><p>Warning: this site is listed as a phising site!</p></div>
        <?php
    }
    else {
        ?>
        <div class="success"><p>Site is clean!</p></div>
        <?php
    }
}

function get_input() {
    $url = isset($_REQUEST{'url'}) ? $_REQUEST{'url'} : '';
    return array('url'=>$url);
}
?>
    <form action="is_phish_ui.php" name="is_phish_ui.php" method="POST">
        <p>url: <input type="text" name="url" value="" size="150"></p>
        <input type="submit" value="Check PhishTank">
    </form>
       </div>
    </div>
    </body>
</html>
