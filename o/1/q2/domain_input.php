<?php
include './model/db.inc';
include './model/Domain.inc';

include './view/ui.inc';
include './view/domain_input.inc';

$in = get_input();
$d = new Domain;

if ($in['mode'] === 'validate') {
	// ajax call
}
elseif ($in['mode'] === 'submit') {
	// set the object
	$d->url = $in['url'];
	$d->desc = $in['desc'];
	
    $domain = $d->getDomain();
    
	if ($domain) {
		$d->domain = $domain;
        $d->valid = $d->hasValidIP() ? 'y' : 'n';
	}
	else {
    // domain was totally invalid, but we want to log the user input anyway
		$d->domain = $d->url;
		$d->valid = 'n';
	}
	
	$result = $d->save();
	
	echo html_header('Domain Logger');
	
	if (!$result) {
		// we're saving bogus entries as well, but otherwise, this could be used for garbage urls
		echo save_error();
		echo domain_input_form($d);
	}
	else {
		echo save_confirmation($d);
		echo domain_input_form();
	}
	
	echo html_footer();
}
else {
	echo html_header('Domain Logger');
	echo domain_input_form();
	echo html_footer();
}

function get_input() {
	$mode = isset($_REQUEST{'mode'}) ? $_REQUEST{'mode'} : 'new';
	$url  = isset($_REQUEST{'url'})  ? urlencode(trim($_REQUEST{'url'}))  : '';
	$desc = isset($_REQUEST{'desc'}) ? urlencode(trim($_REQUEST{'desc'})) : '';

    $url = strtolower($url);
	
	return array(
		'mode'=> $mode,
		'url' => $url,
		'desc'=> $desc,
	);
}
?>
