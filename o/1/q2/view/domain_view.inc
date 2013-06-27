<?php

function domain_table($domains) {
	$bits = array();
	$c = 0;
	foreach ($domains as $d) {
		$class = $c++%2 == 0 ? 'even' : 'odd';

        $domain = htmlentities($d->domain);
        $desc   = htmlentities($d->desc);
        $time   = date('Y-M-d H:i', $d->ctime);

		$bits[] = "<tr class='$class'><td>$domain</td><td>$desc</td><td>{$d->valid}</td><td>$time</td></tr>";
	}
	$html = '<table><tr><th>Domain</th><th>Description</th><th>Valid</th><th>Time Created</th></tr>'.implode("\n", $bits).'</table><p><a href="domain_input.php">Log A Domain</a></p>';
	return $html;
}

?>
