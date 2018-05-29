(function(window, factory) {
	var globalInstall = function(){
		factory(window.lazySizes);
		window.removeEventListener('lazyunveilread', globalInstall, true);
	};

	factory = factory.bind(null, window, window.document);

	if(typeof module == 'object' && module.exports){
		factory(require('lazysizes'));
	} else if(window.lazySizes) {
		globalInstall();
	} else {
		window.addEventListener('lazyunveilread', globalInstall, true);
	}
}(window, function(window, document, lazySizes) {
	'use strict';

	var slice = [].slice;
	var regBlurUp = /blur-up["']*\s*:\s*["']*(always|auto|unobtrusive)/;

	var matchesMedia = function (source) {
		var media = source.getAttribute('data-media') || source.getAttribute('media');
		return !media || window.matchesMedia(lazySizes.cfg.customMedia[media] || media).matches;
	};

	var getLowSrc = function (picture, img) {
		var sources = picture ? slice.call(picture.querySelectorAll('source, img')) : [img];

		return sources.find(function (src) {
			return matchesMedia(src) || src.getAttribute('data-lowsrc');
		}).getAttribute('data-lowsrc');
	};

	var createBlurup = function(picture, img, src, blurUp){
		var isBlurUpLoaded = false;
		var isForced = false;
		var start = blurUp == 'always' ? 0 : Date.now();
		var isState = 0;
		var parent = (picture || img).parentNode;
		var blurImg = document.createElement('img');

		var remove = function () {
			lazySizes.rAF(function() {
				try {
					blurImg.parentNode.removeChild(blurImg);
				} catch(er){

				}
			});
		};

		var setStateUp = function(force){
			isState++;

			isForced = force || isForced;

			if(force){
				remove();
			} else if(isState > 1) {
				setTimeout(remove, 5000);
			}
		};

		var onload = function() {
			img.removeEventListener('load', onload);
			img.removeEventListener('error', onload);

			lazySizes.rAF(function(){
				lazySizes.aC(blurImg, 'ls-original-loaded');
			});

			if(!isBlurUpLoaded || Date.now() - start < 66){
				setStateUp(true);
			} else {
				setStateUp();
			}
		};

		blurImg.addEventListener('load', function(){
			isBlurUpLoaded = true;

			requestAnimationFrame(function () {
				lazySizes.rC(blurImg, 'ls-blur-up-loading');
				lazySizes.aC(blurImg, 'ls-blur-up-loaded');
			});
		});

		blurImg.className = 'ls-blur-up-img ls-blur-up-loading';
		blurImg.src = src;

		img.addEventListener('load', onload);
		img.addEventListener('error', onload);

		if(blurUp != 'unobtrusive'){
			blurImg.className += ' ls-inview';
			setStateUp();
		} else {
			if(!parent.getAttribute('data-expand')){
				parent.setAttribute('data-expand', -1);
			}

			parent.addEventListener('lazybeforeunveil', function (e) {
				if(parent != e.target){
					return;
				}

				lazySizes.aC(blurImg, 'ls-inview');

				setStateUp();
			});

			lazySizes.aC(parent, lazySizes.cfg.lazyClass);
		}

		parent.insertBefore(blurImg, (picture || img).nextSibling);

		if(blurUp != 'always'){
			blurImg.style.visibility = 'hidden';

			setTimeout(function(){
				requestAnimationFrame(function () {
					if(!isForced){
						blurImg.style.visibility = '';
					}
				});
			}, 20);
		}

	};

	window.addEventListener('lazybeforeunveil', function (e) {
		var detail = e.detail;

		if(detail.instance != lazySizes || !detail.blurUp){return;}

		var img = e.target;
		var picture = img.parentNode;

		if(picture.nodeName != 'PICTURE'){
			picture = null;
		}

		var src = getLowSrc(picture, img);

		if(!src){return;}

		createBlurup(picture, img, src, detail.blurUp);
	});

	window.addEventListener('lazyunveilread', function (e) {
		var detail = e.detail;

		if(detail.instance != lazySizes){return;}

		var img = e.target;
		var match = (getComputedStyle(img, null) || {fontFamily: ''}).fontFamily.match(regBlurUp);

		if(!match && !img.getAttribute('data-lowsrc')){return;}

		detail.blurUp = match && match[1] || 'auto';
	});
}));