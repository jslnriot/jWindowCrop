/*
 * jWindowCrop forked
 */
(function($){
    function fillContainer(val, targetLength, containerLength) { // ensure that no gaps are between target's edges and container's edges
        if(val + targetLength < containerLength) val = containerLength-targetLength;
        if(val > 0) val = 0;
        return val;
    }

    $.jWindowCrop = function(image, options){
        var base = this;
        
        base.$image = $(image); // target image jquery element
        base.image = image; // target image dom element
        base.$image.data("jWindowCrop", base); // target frame jquery element

        base.namespace = 'jWindowCrop';
        base.originalWidth = 0;
        base.isDragging = false;

        base.init = function(){
            base.$image.css({display:'none'}); // hide image until loaded
            base.options = $.extend({},$.jWindowCrop.defaultOptions, options);
            if(base.options.zoomSteps < 2) { 
                base.options.zoomSteps = 2 
            };
            
            base.position = {
                x:0,
                y:0
            };
            
            base.trackChange = 'no';
            base.$image.addClass('jwc_image').wrap('<div class="jwc_frame" />'); // wrap image in frame
            base.$frame = base.$image.parent();
            base.$frame.append(base.options.loadingText);
            base.$frame.append('<div class="jwc_controls" style="display:'+(base.options.showControlsOnStart ? 'block' : 'block')+';"><a href="#" class="jwc_zoom_out icon-zoom-out"></a><a href="#" class="jwc_zoom_in icon-zoom-in"></a></div>');
            base.$frame.css({'overflow': 'hidden', 'position': 'relative', 'width': base.options.targetWidth, 'height': base.options.targetHeight});
            base.$image.css({'position': 'absolute', 'top': '0px', 'left': '0px'});

            base.$frame.find('.jwc_zoom_in').on('click.'+base.namespace, base.zoomIn);
            base.$frame.find('.jwc_zoom_out').on('click.'+base.namespace, base.zoomOut);
            base.$frame.on('mouseenter.'+base.namespace, handleMouseEnter);
            base.$frame.on('mouseleave.'+base.namespace, handleMouseLeave);
            base.$image.on('load.'+base.namespace, handeImageLoad);
            
            // Called when using a mouse
            base.$image.on('mousedown.'+base.namespace, handleMouseDown);
            $(document).on('mousemove.'+base.namespace, handleMouseMove);
            $(document).on('mouseup.'+base.namespace, handleMouseUp);
           
            /*
             * When using mobile devices handle touches differently with diffent functions 
             * MS Touch Events : "MSPointerDown","MSPointerMove","MSPointerUp"
             * Everyone else : "touchstart","touchmove","touchend"
             */
            base.$image.on(base.options.touchEvents[0], handleTouchDown);
            base.$image.on(base.options.touchEvents[1], handleTouchMove);
            base.$image.on(base.options.touchEvents[2], handleTouchUp);
        };


        function storeFocalPoint(x, y) {
            if (!x && !y) {
                var x = (parseInt(base.$image.css('left'))*-1 + base.options.targetWidth/2) / base.workingPercent;
                var y = (parseInt(base.$image.css('top'))*-1 + base.options.targetHeight/2) / base.workingPercent;
            }
            base.focalPoint = {'x': Math.round(x), 'y': Math.round(y)};
        }

        function focusOnCenter(left, top, x, y) {
            if (!left && !top) {
                var left = fillContainer((Math.round((base.focalPoint.x*base.workingPercent) - base.options.targetWidth/2)*-1), base.$image.width(), base.options.targetWidth);
                var top = fillContainer((Math.round((base.focalPoint.y*base.workingPercent) - base.options.targetHeight/2)*-1), base.$image.height(), base.options.targetHeight);
                base.$image.css({'left': (left.toString()+'px'), 'top': (top.toString()+'px')});
                storeFocalPoint();
                return
            }
            base.$image.css({'left': (left.toString()+'px'), 'top': (top.toString()+'px')});
            storeFocalPoint(x, y);
        }

        base.setZoom = function(percent) {
            /* If base.options.saved_state is > 0  */
            if (base.options.saved_state > 0) {
                // TO BE PASSED
                // percent   newLeft  newTop   x    y
                var percent = base.options.saved_state_values[0];
                focusOnCenter(base.options.saved_state_values[1], base.options.saved_state_values[2], base.options.saved_state_values[3], base.options.saved_state_values[4]);
                // Set this back to zero so we can still crop and zoom 
                base.options.saved_state = 0;
            } 

            if(base.minPercent >= 1) {
                percent = base.minPercent;
            } else if(percent > 1.0) {
                percent = 1;
            } else if(percent < base.minPercent) {
                percent = base.minPercent;	
            }
            
            base.$image.width(Math.ceil(base.originalWidth*percent));
            base.workingPercent = percent;
            
            updateResult();
            focusOnCenter();
        };

        base.zoomIn = function() {
            // Track changes made
            base.trackChange = 'yes';
            var zoomIncrement = (1.0 - base.minPercent) / (base.options.zoomSteps-1);
            base.setZoom(base.workingPercent+zoomIncrement);
            return false;
        };

        base.zoomOut = function() {
            // Track changes made
            base.trackChange = 'yes';
            var zoomIncrement = (1.0 - base.minPercent) / (base.options.zoomSteps-1);
            base.setZoom(base.workingPercent-zoomIncrement);
            return false;
        };

        function initializeDimensions() {
            if(base.originalWidth == 0) {
                base.originalWidth = base.$image.width();
                base.originalHeight = base.$image.height();
            }
            if(base.originalWidth > 0) {
                var widthRatio = base.options.targetWidth / base.originalWidth;
                var heightRatio = base.options.targetHeight / base.originalHeight;

                base.minPercent = (widthRatio >= heightRatio) ? widthRatio : heightRatio;
                if(widthRatio >= heightRatio) {
                    base.minPercent = (base.originalWidth < base.options.targetWidth) ? (base.options.targetWidth / base.originalWidth) : widthRatio;
                } else {
                    base.minPercent = (base.originalHeight < base.options.targetHeight) ? (base.options.targetHeight / base.originalHeight) : heightRatio;
                }

                base.focalPoint = {'x': Math.round(base.originalWidth/2), 'y': Math.round(base.originalHeight/2)};
                base.focalPoint = {'x': 200, 'y': 200};
                base.setZoom(base.minPercent);
                base.$image.fadeIn('fast'); //display image now that it has loaded
            }
        }


        function updateResult() {
            base.result = {
                cropX: Math.floor(parseInt(base.$image.css('left'))/base.workingPercent*-1),
                cropY: Math.floor(parseInt(base.$image.css('top'))/base.workingPercent*-1),
                cropW: Math.round(base.options.targetWidth/base.workingPercent),
                cropH: Math.round(base.options.targetHeight/base.workingPercent),
                mustStretch: (base.minPercent > 1),
                
                cropPercent: base.workingPercent,
                cropNewTop: base.position.newTop,
                cropNewLeft: base.position.newLeft,
                
                trackChange: base.trackChange
            };
            base.options.onChange.call(base.image, base.result);
        }

        function handeImageLoad() {
            initializeDimensions();
        }

        function handleMouseDown(event) {
            event.preventDefault(); //some browsers do image dragging themselves
            base.isDragging = true;
            base.dragMouseCoords = {x: event.pageX, y: event.pageY};
            base.dragImageCoords = {x: parseInt(base.$image.css('left')), y: parseInt(base.$image.css('top'))};
        }

        function handleMouseMove(event) {
            if(base.isDragging) {
                var xDif = event.pageX - base.dragMouseCoords.x;
                var yDif = event.pageY - base.dragMouseCoords.y;			
                var newLeft = fillContainer((base.dragImageCoords.x + xDif), base.$image.width(), base.options.targetWidth);
                var newTop = fillContainer((base.dragImageCoords.y + yDif), base.$image.height(), base.options.targetHeight);
                
                base.position = {
                    newLeft: newLeft,
                    newTop: newTop
                }
                
                base.$image.css({'left' : (newLeft.toString()+'px'), 'top' : (newTop.toString()+'px')});
                
                // Track changes made
                base.trackChange = 'yes';
                storeFocalPoint();
                updateResult();
            }
        }

        function handleMouseUp() {
            base.isDragging = false;
        }

        // Registers finger down on mobile device 
        function handleTouchDown(event) {  
            if (event.type == 'touchstart') {
                event.preventDefault();
            }
            base.isDragging = true;
            base.dragMouseCoords = {x: event.originalEvent.touches[0].clientX, y: event.originalEvent.touches[0].clientY};
            base.dragImageCoords = {x: parseInt(base.$image.css('left')), y: parseInt(base.$image.css('top'))};
        }
        
        // Registers finger moving on mobile device 
        function handleTouchMove(event) {
            if (event.type == 'touchmove'){
                event.preventDefault();
            }
            
            var xDif = event.originalEvent.touches[0].pageX - base.dragMouseCoords.x;
            var yDif = event.originalEvent.touches[0].pageY - base.dragMouseCoords.y;

            var newLeft = fillContainer((base.dragImageCoords.x + xDif), base.$image.width(), base.options.targetWidth);
            var newTop  = fillContainer((base.dragImageCoords.y + yDif), base.$image.height(), base.options.targetHeight);

            base.position = {
                newLeft: newLeft,
                newTop: newTop
            }

            base.$image.css({'left' : (newLeft.toString()+'px'), 'top' : (newTop.toString()+'px')});
            base.trackChange = 'yes';
            storeFocalPoint();
            updateResult();
        }

        // Registers finger up on mobile device
        function handleTouchUp(event) {
            storeFocalPoint();
            base.isDragging = false;
        }

        function handleMouseEnter() {
        //  if(base.options.smartControls) base.$frame.find('.jwc_controls').fadeIn('fast');
        }

        function handleMouseLeave() {
        //  if(base.options.smartControls) base.$frame.find('.jwc_controls').fadeOut('fast');
        }

        base.init();
    };

    $.jWindowCrop.defaultOptions = {
        targetWidth: 250,
        targetHeight: 250,
        touchEvents: new Array("touchstart","touchmove","touchend"),
        zoomSteps: 10,
        loadingText: 'Loading...',
        smartControls: true,
        showControlsOnStart: true,
        onChange: function() {}
    };
    
    $.fn.jWindowCrop = function(options){
        return this.each(function(){
        (new $.jWindowCrop(this, options));
        });
    };

    $.fn.getjWindowCrop = function(){
        return this.data("jWindowCrop");
    };
})(jQuery);

