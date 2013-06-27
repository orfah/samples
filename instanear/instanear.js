var NB = {};
NB.CLIENT_ID = 'YOUR INSTAGRAM CLIENT ID';
NB.photos = [];
NB.page = 1;
NB.lastFill = 0;
// distance in meters
NB.distance = 1000;

NB.showError = function(errorObj) {
    if (!NB.errorView) { NB.errorView = new NB.Views.InstagramError; }
    NB.errorView.errorObj = errorObj;
    NB.errorView.show();            
};

NB.displayThumbnail = function() {
    var tablePos = Math.floor(this.position/16),
        pos = this.position%16,
        ph = $(NB.thumbnail.tables[tablePos]).find('.placeholder')[pos],
        p = $(ph).next(),
        now = Date.now()/1000,
        diff, timestr;
        
    $(this).addClass('insta');
    $(ph).css('opacity', 0);
    $(ph.parentNode).append(this);
    $(ph.parentNode).css('background', '#fff');

    diff = now - NB.photos[this.position].created_time;
    if (diff < 60) { timestr = diff + 's ago'; }
    else if (diff < 3600) { timestr = Math.floor(diff/60) + 'm'; }
    else if (diff < 86400) { timestr = Math.floor(diff/3600) + 'h'; }
    else { timestr = Math.floor(diff/86400) + 'd'; }

    p.children('.time').text(timestr);
    p.children('.user').text(NB.photos[this.position].user.username);
              
    var that = this;
    setTimeout(function() {
        $(that).css('opacity', 1);
    }, 20);
};

NB.refresh = function() {
    // clear out all the photos
    $('.thumbnail').remove();
    $('.user').text('');
    $('.time').text('');
    $('.placeholder').css('opacity', 0.45);
    $('table td div').css('background', '#eee');
    NB.photos = [];
    NB.page = 1;
    NB.lastFill = 0;
    if (NB.errorView) { NB.errorView.hide(); }

    NB.gettingPosition = true;
    navigator.geolocation.getCurrentPosition(NB.setPosition, function() { console.log('geo failed') }, {timeout: 10000});
    setTimeout(function() {
        if (NB.gettingPosition) {
            // seems like geolocation has failed
             NB.fetchPhotos();
        }
    }, 10000)
};
NB.fetchPhotos = function(olderThan) {
    if (NB.position) {
        var url = "https://api.instagram.com/v1/media/search?lat=" + 
              NB.position.coords.latitude +
              "&lng=" + NB.position.coords.longitude + 
              '&callback=NB.setPhotos&distance=' + NB.distance +
              '&client_id=' + NB.CLIENT_ID;
            
        if (olderThan) { url += '&max_timestamp='+NB.oldest; }
        $.getScript(url);
    }
}

NB.setPosition = function(position) {
    NB.gettingPosition = false;
    $('#loading').css('display', 'none');
    NB.position = position;
    localStorage.setItem('position', JSON.stringify(position));
    NB.fetchPhotos();
    
    $.ajax({
           url: 'api.php',
           data: {lat: position.coords.latitude, lon: position.coords.longitude
        },
        success: NB.setAddress,
        dataType: 'json'
    });
};

NB.setAddress = function(data) {
    var addr;
    if (data) {
        addr = data.results[0].formatted_address.split(',');
        localStorage.setItem('address', JSON.stringify(addr));
    }
    else {
        addr = JSON.parse(localStorage.getItem('address'));
    }

    $('.thumbnail-container .header p').text(addr[0]);
    $('#location').text(addr[1] + ' ' + addr[2]);
};
NB.setPhotos = function(env, initFromLocalStorage) {
    if (!initFromLocalStorage && !env.data) {
        // error! abort
        NB.showError(env.meta);
    }
    else {
        if (initFromLocalStorage) {
               NB.photos = JSON.parse(localStorage.getItem('photos')); 
               NB.oldest = NB.photos[NB.photos.length - 1].created_time - 60;
        }
        else {
              var data = env.data,
                  imageHolder,
                  l = data.length,
                  i;
        
              for (i = 0; i < l; i++) {
                  if (NB.photos.length === 0 || data[i].id != NB.photos[NB.photos.length - 1].id) {
                      NB.photos.push(data[i]);
                      NB.oldest = data[l-1].created_time - 60;
                  }
              }
        }
        
        l = Math.min(NB.photos.length, NB.page * 16);
        for (i = NB.lastFill; i < l; i++) {
              imageHolder = document.getElementById('image-loader').appendChild(document.createElement('img'));
              imageHolder.src = NB.photos[i].images.thumbnail.url;
              imageHolder.position = i;
              imageHolder = $(imageHolder);
              imageHolder.data('position', i);

              imageHolder.css('opacity', 0);
              imageHolder.load(NB.displayThumbnail);
              imageHolder.addClass('thumbnail');
              NB.lastFill = i;
        }
        NB.lastFill += 1;
          
          if (NB.photos.length < NB.page * 16) {
              NB.fetchPhotos(true);
           }
           else {
              localStorage.setItem('photos', JSON.stringify(NB.photos));
           }
    }
};

NB.showLargePicture = function(event) {
    var pos = $(event.target).data('position');
    if (pos !== undefined) {
        if (!NB.detail) { NB.detail = new NB.Views.Detail; }
        NB.detail.setPlaceholder();
        NB.Utils.pageInDetail();

        setTimeout(function() {
           var img = NB.photos[pos];
        NB.detail.setImage(img);
        NB.detail.setMap();
          
           $.ajax({
            url: 'api.php',
            data: {lat: img.location.latitude, lon: img.location.longitude},
               success: NB.detail.setPosition,
               dataType: 'json'
        });
            
        }, 400)
    }
};

NB.hideLargePicture = function(event) {
    NB.Utils.pageOutDetail();
};

NB.didPageForward = function() {
    if (NB.page == NB.thumbnail.tables.length) {
          NB.thumbnail.createTable();
          $(NB.thumbnail.tables[NB.page]).css('-webkit-transform', 'translate3d(640px, 0, 0)');
          NB.fetchPhotos(true);
    }
};

NB.Views = {};
NB.Views.Thumbnail = function() {
    this.picsPerRow = 4;
    this.rows = 4;
    this.layer = null;
    this.tables = [];
    this.activeTable = 0;
    this.init();
};
NB.Views.Thumbnail.prototype.init = function() {
    this.layer = document.createElement('div');
    this.header = this.layer.appendChild(document.createElement('div'));
    this.address = this.header.appendChild(document.createElement('p'));
    this.refresh = this.header.appendChild(document.createElement('div'));
    this.footer = this.layer.appendChild(document.createElement('div'));

    // create first page & second so we can swipe over
    this.createTable();
    this.createTable();
    this.setTablePositions();
    
    $(this.layer).addClass('thumbnail-container');
    $(this.header).addClass('header');
    $(this.refresh).addClass('refresh');
    $(this.refresh).html('<img src="images/refresh.png">');
    $(this.footer).addClass('footer');

    $(this.refresh).on('click', NB.refresh);
};
NB.Views.Thumbnail.prototype.createTable = function() {
    var table = document.createElement('table'),
        i, j, tableHTML = [];
    for (i = 0; i < this.rows; i++) {
        tableHTML.push('<tr>');
          for (j = 0; j < this.picsPerRow; j++) {
              tableHTML.push('<td><div><img class="placeholder" src="images/instagram-icon.png"><p><span class="user"></span><span class="time"></span></div></td>');
          }
          tableHTML.push('</tr>');
    }
    table.innerHTML = tableHTML.join('');
    this.layer.appendChild(table);
    this.tables.push(table);
    
    return table;
};

NB.Views.Thumbnail.prototype.setActiveTable = function(tableNumber) {
    if (tableNumber == this.tables.length) {
          this.table.push(this.createTable);
    }
    this.activeTable = tableNumber;
};

NB.Views.Thumbnail.prototype.setTablePositions = function() {
    var i, l = this.tables.length,
        x;
    for (i = 0; i < l; i++) {
        if (this.activeTable < i) { x = '640px'; }
        else if (this.activeTable == i) { x = '0'; }
        else { x = '-640px'; }
           $(this.tables[i]).css('-webkit-transform', 'translate3d(' + x + ', 0, 0)');
    }
};

NB.Views.Detail = function() {
    this.layer = document.createElement('div');
    this.header = this.layer.appendChild(document.createElement('div'));
    this.backButton = new NB.Views.Button;
    this.header.appendChild(this.backButton.layer);
      
    this.captionContainer = this.layer.appendChild(document.createElement('div'));
    this.caption = this.captionContainer.appendChild(document.createElement('span'));
    this.user = this.captionContainer.appendChild(document.createElement('div'));
    this.userImg = this.user.appendChild(document.createElement('img'));
    this.userName = this.user.appendChild(document.createElement('span'));
      
    this.imgContainer = this.layer.appendChild(document.createElement('div'));
    this.img = this.imgContainer.appendChild(document.createElement('img'));
    this.imgPlaceholder = this.imgContainer.appendChild(document.createElement('img'));
    this.mapOuterContainer = this.layer.appendChild(document.createElement('div'));
    this.mapContainer = this.mapOuterContainer.appendChild(document.createElement('div'));
    this.mapControl = this.mapOuterContainer.appendChild(document.createElement('div'));
    this.mapControl.innerText = '+';
    
    this.mapOuterContainer.id = 'map-container';
    this.mapContainer.id = 'map';
    $(this.mapControl).addClass('map-control');
    
    this.backButton.setText('Back');
    
    $(this.imgContainer).addClass('large-image-container');
    $(this.imgPlaceholder).addClass('placeholder');
    this.imgPlaceholder.src = "images/instagram-icon-large.png";
    
    $(this.backButton.layer).addClass('back');
    $(this.user).addClass('user');
    $(this.captionContainer).addClass('caption-container');
    $(this.caption).addClass('caption');
    $(this.header).addClass('header');
    $(this.layer).addClass('detail');
    $(this.img).addClass('large-image');
    $(this.backButton.layer).on('click', function() {NB.Utils.pageOutDetail(); });
    $(this.layer).addClass('next');

    $('#content-container').append(this.layer); 
  };
NB.Views.Detail.prototype.setImage = function(img) {
    var ph = $(this.imgPlaceholder),
        imgObj = $(this.img);
    this._img = img;
    this.img.src = img.images.standard_resolution.url;
    
    imgObj.load(function() {
           ph.addClass('fadeout');
           imgObj.removeClass('fadeout');
    });
    this.pos = new google.maps.LatLng(img.location.latitude, img.location.longitude);
    this.caption.innerText = img.caption.text;
    this.userImg.src = img.caption.from.profile_picture;
    this.userName.innerText = img.caption.from.username;
};
NB.Views.Detail.prototype.setPlaceholder = function() {
    var ph = $(this.imgPlaceholder),
        imgObj = $(this.img);
  
    imgObj.addClass('fadeout');
    ph.removeClass('fadeout');
};
NB.Views.Detail.prototype.setMap = function() {
    this.map = new google.maps.Map(
        document.getElementById("map"), {
            center: this.pos, 
            mapTypeId: google.maps.MapTypeId.ROADMAP, 
            zoom: 17, 
            disableDefaultUI: true
           }
    );
    this.marker = new google.maps.Marker({
         map: this.map,
         animation: google.maps.Animation.DROP,
         position: this.pos
    });
      
    $('#map-container .map-control').on('click', $.proxy(this.mapControlClickHandler, this));
};
NB.Views.Detail.prototype.setPosition = function(data) {
    var addr = data.results[0].formatted_address.split(',');
    // put the address in the header
};
NB.Views.Detail.prototype.expandMap = function(event) {
    $('#map').addClass('large-map');
    setTimeout(function() { google.maps.event.trigger(map, 'resize'); }, 500);
};
NB.Views.Detail.prototype.shrinkMap = function() {
         $('#map').removeClass('large-map');
};
NB.Views.Detail.prototype.mapControlClickHandler = function(event) {
    if ($(this.mapControl).hasClass('expanded')) {
           $(this.mapControl).removeClass('expanded');
           this.shrinkMap();
    }
    else {
           $(this.mapControl).addClass('expanded');
           this.expandMap();
    }
};

NB.Views.Button = function() {
    this.layer = document.createElement('div');
    this.textContainer = this.layer.appendChild(document.createElement('div'));
    $(this.textContainer).addClass('text');
};
NB.Views.Button.prototype.setText = function(text) {
    this.textContainer.innerText = text;
};

/* Instagram API frequently throws an error */
NB.Views.InstagramError = function() {
    this.layer = document.createElement('div');
    $(this.layer).addClass('error');
    this.layer.innerHTML = '<img src="images/blinky.png"><p>There was an instagram api error! (this happens a lot, sorry)</p><p>Hit the refresh button to try again...</p>';
    $('#content-container').append($(this.layer));
};
NB.Views.InstagramError.prototype.show = function() {
    $('#loading').css('display', 'block').css('opacity', 0.7).css('z-index', 20);
    $(this.layer).addClass('show');
};
NB.Views.InstagramError.prototype.hide = function() {
    $('#loading').css('opacity', 0).css('z-index', -1).css('display', 'none');
      $(this.layer).removeClass('show');
};

NB.Views.Config = function() {
    
};

NB.Views.Config.prototype.show = function() {
    
};

NB.Views.Config.prototype.hide = function() {
    
};

NB.Views.AreaConfig = function() {
    this.radius = 500;
};

NB.Views.AreaConfig.prototype.handleDragEvent = function() {
    
};

NB.Utils = {};
NB.Utils.pageInDetail = function() {
    var detailPage = $(NB.detail.layer),
        thumbnailPage = $('.thumbnail-container.active');
        
    thumbnailPage.removeClass('active').addClass('previous').addClass('fadeout');
    detailPage.addClass('hidden');

      setTimeout(function() {
           detailPage.removeClass('next').removeClass('hidden');
           detailPage.addClass('active');
      }, 0);

};
NB.Utils.pageOutDetail = function() {
    var detailPage = $(NB.detail.layer);
    $('.thumbnail-container').removeClass('previous').addClass('active').removeClass('fadeout');
    
    setTimeout(function() {
         detailPage.removeClass('active');
         detailPage.addClass('next');
    }, 0);
    setTimeout(function() {
        detailPage.shrinkMap();
    }, 600);
};

NB.Utils.pageInThumbnails = function() {
    
};

NB.Utils.pageOutThumbnails = function() {
    
};

NB.Utils.onRotation = function(event) {
     var viewport = document.querySelector('meta[name="viewport"]');
     NB.Utils.width = window.orientation === 0 ? 640 : 960;
     viewport.content = 'width=' + NB.Utils.width + ', minimum-scale=0.5, maximum-scale=0.5, initial-scale=0.5';
};

NB.handleTouchMove = function(event) {
    if (!NB.touchStarted) { return; }
    else if (event.originalEvent.touches.length == 1) {
        var x = event.originalEvent.touches[0].clientX - NB.x;
        NB.table.css('-webkit-transform', 'translate3d(' + x + 'px, 0, 0)');
        NB.nextTable.css('-webkit-transform', 'translate3d(' + (x+640) + 'px, 0, 0)');
        if (NB.previousTable) {
            NB.previousTable.css('-webkit-transform', 'translate3d(' + (x-640) + 'px, 0, 0)');
        }
        NB.lastX = event.originalEvent.touches[0].clientX;
    }
};

NB.touchDidStart = function(event) {
    var t = $(event.target);
    if (t.parents('table')) {
        NB.touchStarted = Date.now();
        // only care about movement in the x plane
        NB.x = event.originalEvent.touches[0].clientX;
        NB.table = $(NB.pages[0].tables[NB.page-1]);
        NB.nextTable = $(NB.pages[0].tables[NB.page]);
        NB.previousTable = NB.page > 1 ? $(NB.pages[0].tables[NB.page-2]) : undefined;
    }
    else {
        NB.touchStarted = false;
    }
}
NB.touchDidEnd = function(event) {
    var now = Date.now(),
        then = NB.touchStarted;

    NB.touchStarted = false;
    if (then+100 > now) {
        // touch was too short, not a real touch
        NB.table.addClass('animate');
        NB.nextTable.addClass('animate');
        NB.table.css('-webkit-transform', 'translate3d(0, 0, 0)');
        NB.nextTable.css('-webkit-transform', 'translate3d(640px, 0, 0)');
        if (NB.previousTable) { 
               NB.previousTable.addClass('animate');
               NB.previousTable.css('-webkit-transform', 'translate3d(-640px, 0, 0)'); 
        }
          
        setTimeout(function() {
            NB.previousTable.removeClass('animate');
            NB.table.removeClass('animate');
            NB.nextTable.removeClass('animate');
        }, 400)

        return;                                   
    }

    var deltaX = NB.x - NB.lastX;
        absX = Math.abs(deltaX),
        pageFwd = false;

    // our page threshold is pretty strict
    NB.table.addClass('animate');
    NB.nextTable.addClass('animate');
    if (NB.previousTable) { NB.previousTable.addClass('animate'); }

    if (absX > 250) {
        if (deltaX > 0) {
            NB.table.css('-webkit-transform', 'translate3d(-640px, 0, 0)');
            NB.nextTable.css('-webkit-transform', 'translate3d(0, 0, 0)');
            NB.page += 1;
            pageFwd = true;
        }
        else {
            if (NB.page == 1) {
                NB.table.css('-webkit-transform', 'translate3d(0, 0, 0)');
            }
            else {
                NB.table.css('-webkit-transform', 'translate3d(640px, 0, 0)');
                NB.previousTable.css('-webkit-transform', 'translate3d(0, 0, 0)');
                NB.page -= 1;
            }
        }
    }
    else {
        NB.table.css('-webkit-transform', 'translate3d(0, 0, 0)');
        NB.nextTable.css('-webkit-transform', 'translate3d(640px, 0, 0)');
        if (NB.previousTable) { 
            NB.previousTable.css('-webkit-transform', 'translate3d(-640px, 0, 0)'); 
        }
    }
    setTimeout(function() { 
        NB.table.removeClass('animate'); 
        NB.nextTable.removeClass('animate'); 
        if (NB.previousTable) { NB.previousTable.removeClass('animate'); }
        // for perf reasons, do this after anim is finished
        if (pageFwd) { NB.didPageForward(); }
    }, 500);
};

NB.init = function() {
    NB.pages = [];
    NB.pages[0] = new NB.Views.Thumbnail;
    NB.thumbnail = NB.pages[0];

    $(NB.pages[0].layer).addClass('active');
    $('#content-container').append(NB.pages[0].layer);

    if (localStorage.getItem('photos') && localStorage.getItem('photos')) {
           NB.setAddress();
           NB.setPhotos(undefined, true);
           NB.position = JSON.parse(localStorage.getItem('position'));
    }
    else {
        navigator.geolocation.getCurrentPosition(NB.setPosition, function(error) { document.getElementById('test').innerText = 'initial geoloc failed: ' + error.code + ' ' + error.message; });
    }
    $('#content-container').on('click', 'img.insta', NB.showLargePicture);
    $('#content-container').on('touchstart', NB.touchDidStart);
    $('#content-container').on('touchend', NB.touchDidEnd);
    $('#content-container').on('touchmove', NB.handleTouchMove);
    $(window).on('orientationchange', NB.Utils.onRotation);
}

document.body.addEventListener('touchmove', function(event) { event.preventDefault(); }, false); 
window.onload = function() { NB.init(); }
