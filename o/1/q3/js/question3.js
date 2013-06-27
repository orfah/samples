$(document).ready( function() {
	var xml = false,
        page = 0,
    
    rssParse = function() {
        var itemList = $(xml).find('item'),
            startItem = page*3, 
            endItem = startItem + 3, 
            item,
        	articles = $('<div>');
        
        for (var i = startItem; i < endItem; i++) {
            // silently fails to load when we run past the array boundary
            if (itemList[i]) {
                item = $(itemList[i]); 
                $('<div class="item">').html('<a href="'+item.find('link').text()+'">'+item.find('title').text() + '</a>').appendTo(articles);
            }
        }
        if ($(articles).find('a').length > 0) {
            $('#articles').empty();
            articles.appendTo('#articles');
            return true;
        }
        return false;
    },
    
    fetchRss = function() {
		$.get('rss.xml', function(myxml) {
            xml = myxml;
            rssParse();
		}, 'xml')
	},
	
	rssPageClickHandler = function(e) {
        if (!xml) {
            fetchRss();
        }
        var original_page = page;
        if ($(this).attr('id') == 'right-arrow') {
            page += 1;
        }
        else if ($(this).attr('id') == 'left-arrow') {
            page -= 1;
        }
        if (page < 0) {
            page = 0;
        }
        if (!rssParse()) {
            // no more articles, reset the page count
            page = original_page; 
        }
	};
	
	// create the container and controls on the empty page
	$('<div id="articles"></div><div id="controls"><div id="left-arrow">&lt;&lt;</div><div id="right-arrow">&gt;&gt;</div></div>').appendTo('body');
	$('#controls').delegate('div', 'click', rssPageClickHandler);
});
