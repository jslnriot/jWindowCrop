/*
 * jWindowCrop v1.0.0
 *
 * Copyright (c) 2012 Tyler Brown
 * Licensed under the MIT license.
 *
 */

(function($){
	function fillContainer(val, targetLength, containerLength) { // ensure that no gaps are between target's edges and container's edges
		if(val > 0) val = 0;
		if(val + targetLength < containerLength) val = containerLength-targetLength;
		return val;
	}

	$.jWindowCrop = function(image, options){
		var base = this;
		base.namespace = 'jWindowCrop';
		base.$image = $(image); // target image jquery element
		base.image = image; // target image dom element
		base.$image.data("jWindowCrop", base); // target frame jquery element

		base.isDragging = false;
		
		base.init = function(){
			base.options = $.extend({},$.jWindowCrop.defaultOptions, options);
			if(base.options.zoomSteps < 2) base.options.zoomSteps = 2;

			base.$image.addClass('jwc_image').wrap('<div class="jwc_frame" />'); // wrap image in frame
			base.$frame = base.$image.parent();
			base.$frame.append('<div class="jwc_controls"><span>click to drag</span><a href="#" class="jwc_zoom_in"></a><a href="#" class="jwc_zoom_out"></a></div>');
			base.$frame.css({'overflow': 'hidden', 'position': 'relative', 'width': base.options.targetWidth, 'height': base.options.targetHeight});
			base.$image.css({'position': 'absolute', 'top': '0px', 'left': '0px'});
			initializeDimensions();

			base.$frame.find('.jwc_zoom_in').on('click.'+base.namespace, base.zoomIn);
			base.$frame.find('.jwc_zoom_out').on('click.'+base.namespace, base.zoomOut);
			base.$image.on('load.'+base.namespace, handeImageLoad);
			base.$image.on('mousedown.'+base.namespace, handleMouseDown);
			$(document).on('mousemove.'+base.namespace, handleMouseMove);
			$(document).on('mouseup.'+base.namespace, handleMouseUp);
		};

		base.setZoom = function(percent) {
			if(percent < base.minPercent) percent = base.minPercent;
			if(percent > 1.0) percent = 1;
			base.$image.width(Math.ceil(base.originalWidth*percent));
			base.workingPercent = percent;
			focusOnCenter();
			updateResult();
		};
		base.zoomIn = function() {
			var zoomIncrement = (1.0 - base.minPercent) / (base.options.zoomSteps-1);
			base.setZoom(base.workingPercent+zoomIncrement);
			return false;
		};
		base.zoomOut = function() {
			var zoomIncrement = (1.0 - base.minPercent) / (base.options.zoomSteps-1);
			base.setZoom(base.workingPercent-zoomIncrement);
			return false;
		};

		function initializeDimensions() {
			base.originalWidth = base.$image.width();
			base.originalHeight = base.$image.height();
			if(base.originalWidth > 0) {
				var widthRatio = base.options.targetWidth / base.originalWidth;
				var heightRatio = base.options.targetHeight / base.originalHeight;
				base.minPercent = (widthRatio >= heightRatio) ? widthRatio : heightRatio;
				base.focalPoint = {'x': Math.round(base.originalWidth/2), 'y': Math.round(base.originalHeight/2)};
				base.setZoom(base.minPercent);
			}
		}
		function storeFocalPoint() {
			var x = (parseInt(base.$image.css('left'))*-1 + base.options.targetWidth/2) / base.workingPercent;
			var y = (parseInt(base.$image.css('top'))*-1 + base.options.targetHeight/2) / base.workingPercent;
			base.focalPoint = {'x': Math.round(x), 'y': Math.round(y)};
		}
		function focusOnCenter() {
			var left = fillContainer((Math.round((base.focalPoint.x*base.workingPercent) - base.options.targetWidth/2)*-1), base.$image.width(), base.options.targetWidth);
			var top = fillContainer((Math.round((base.focalPoint.y*base.workingPercent) - base.options.targetHeight/2)*-1), base.$image.height(), base.options.targetHeight);
			base.$image.css({'left': (left.toString()+'px'), 'top': (top.toString()+'px')})
			storeFocalPoint();
		}
		function updateResult() {
			base.result = {
				cropX: Math.floor(parseInt(base.$image.css('left'))/base.workingPercent*-1),
				cropY: Math.floor(parseInt(base.$image.css('top'))/base.workingPercent*-1),
				cropW: Math.round(base.options.targetWidth/base.workingPercent),
				cropH: Math.round(base.options.targetHeight/base.workingPercent)
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
			base.dragImageCoords = {x: parseInt(base.$image.css('left')), y: parseInt(base.$image.css('top'))}
		}
		function handleMouseUp() {
			base.isDragging = false;
		}
		function handleMouseMove(event) {
			if(base.isDragging) {
				var xDif = event.pageX - base.dragMouseCoords.x;
				var yDif = event.pageY - base.dragMouseCoords.y;
				var newLeft = fillContainer((base.dragImageCoords.x + xDif), base.$image.width(), base.options.targetWidth);
				var newTop = fillContainer((base.dragImageCoords.y + yDif), base.$image.height(), base.options.targetHeight);
				base.$image.css({'left' : (newLeft.toString()+'px'), 'top' : (newTop.toString()+'px')});
				storeFocalPoint();
				updateResult();
			}
		}
		
		base.init();
	};
	
	$.jWindowCrop.defaultOptions = {
		targetWidth: 320,
		targetHeight: 180,
		zoomSteps: 10,
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
