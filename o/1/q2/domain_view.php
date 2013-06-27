<?php
include './model/db.inc';
include './model/Domain.inc';

include './view/ui.inc';
include './view/domain_view.inc';

$in = get_input();

$d = new Domain;
if ($in['mode'] === 'all') {
    $domains = $d->loadall();
}
else {
    $domains = $d->loadi();
}

echo html_header('View Domains');
echo domain_table($domains);
echo html_footer();

function get_input() {
    $mode = isset($_REQUEST{'mode'}) ? $_REQUEST{'mode'} : '';
    return array(
        'mode' => $mode,
    );
}
?>
