<?php
function html_header($title) {
	$html = <<<END
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
	<head>
		<title>$title</title>
		<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/combo?3.2.0/build/cssreset/reset-min.css&3.2.0/build/cssfonts/fonts-min.css&3.2.0/build/cssgrids/grids-min.css"> 
		<link rel="stylesheet" type="text/css" href="css/domain_logger.css">
	</head>
	<body>
        <div class="head"><img src="images/logo_community.gif"></div>
        <div class="body">
            <div id="main-container">
END;
	return $html;
}
function html_footer() {
	$html =<<<END
		    <!-- main-container -->
		    </div>
		<!-- .body -->
		</div>
	</body>
</html>
END;
	return $html;
}
?>
