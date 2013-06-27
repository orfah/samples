<?php

function domain_input_form($domain=false) {
	$url = $desc = '';
	if ($domain) {
		$url = $domain->url;
		$desc = $domain->desc;
	}
	
	$html =<<<END
		<form name="domain-form" action="domain_input.php" method="POST">
			<fieldset>
				<legend>Domain Logger, Jr:</legend>
				<dd>URL:</dd>
				<dt><input type="text" name="url" value="$url" size="150"></dt>
				<dd>Description:</dd>
				<dt><input type="text" name="desc" value="$desc" size="150"></dt>
			</fieldset>
			<input type="hidden" name="mode" value="submit">
			<input type="submit" value="Save">
		</form>
        <p><a href="domain_view.php">View Logged Domains</a></p>
END;
	return $html;
}

function save_error() {
	$html =<<<END
	<div class="error">
		<p>We're sorry, there was an error saving your information.  Please try again.</p>
	</div>
END;
	return $html;
}

function save_confirmation($domain) {
    $url = urldecode($domain->url);
    $url = htmlentities($url);
	$html =<<<END
	<div class="success">
		<p>Your domain, $url, has been saved, thanks!</p>
        <p>Add another?</p>
	</div>
END;
	return $html;
}
?>
