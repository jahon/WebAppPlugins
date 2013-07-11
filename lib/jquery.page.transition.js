/// <reference path="../Scripts/jquery-1.7.2.min.js" />

/*!
 * jQuery page transition 
 * Version: 0.1.1
 * 只兼容webKit
 * Description: 1.实现动画前、后callback。 2.绑定触发切换句柄。 3.自定义动画函数。
 * Date: 2013/07/05
 * Author: Jahon
 */

window.tranPage = function (options) {
    "use strict";
    var defaults = {
        //主体页面:selector
        pages: null,
        //切入动画
        outAnimateClass: 'pt-page-rotateSlideOut',
        //切出动画
        inAnimateClass: 'pt-page-rotateSlideIn',
        //当前选中class
        currClass: 'pt-page-current'
    };
    var ua = navigator.userAgent.toLowerCase(), animEndEventName;

    if (/webkit/i.test(ua)) animEndEventName = 'webkitAnimationEnd';
    else if (/gecko/i.test(ua)) animEndEventName = 'MSAnimationEnd';
    else animEndEventName = 'animationend';
    defaults.aniEndName = animEndEventName;

    this.options = $.extend({}, defaults, options);
    this._init();

};

tranPage.prototype = {
    _isAnimating: false,
    _init: function () {
        this.options.pages.each(function () { return $(this).data('originalClassList', $(this).attr('class')); });
        return this;
    },
    //获取下一页, data_page:data-page的值
    changePage: function (options) {
        var defaults = {
            //内容容器
            wrap: null,
            //将要加载的内容
            page: null,
            //将要切换的页面
            pop: null,
            //切换前触发callback
            beforeTrigger: false,
            //默认显示loading
            showLoading: true,
            startCallback: function (options) { },
            endCallback: function (options) { }
        };
        //切换页面设置
        options = $.extend({}, defaults, options);

        var _self = this, _options = _self.options, outClass = _options.outAnimateClass, inClass = _options.inAnimateClass;

        //没有要切换页面
        if (!options.pop) return;
        //动画进行中,禁止切换
        if (_self.__proto__._isAnimating) return;
        _self.__proto__._isAnimating = true;

        var $currPage = _options.pages.filter('.' + _options.currClass);
        var $nextPage = _options.pages.filter("[data-pop='" + options.pop + "']").addClass(_options.currClass);
        var $wrap = _options.wrap == null ? $nextPage : _options.wrap;
        var wrapExist = $wrap.children().length == 0 ? false : true;//是否已存在内容
        //显示loading
        options.showLoading ? _self.showLoading() : false;
        options.startCallback(options);

        //页面切换前回调
        if (options.beforeTrigger) {
            $.when(_self._getPage(wrapExist, options.page, $nextPage)).done(function () {
                _self._triggerAnimate($currPage, $nextPage, outClass, inClass, _options.aniEndName);
            });

        } else {
            _self._triggerAnimate($currPage, $nextPage, outClass, inClass, _options.aniEndName);
            _self._getPage(wrapExist, options.page, $nextPage);
        }
        options.endCallback(options);
        return this;
    },
    _triggerAnimate: function ($currPage, $nextPage, outClass, inClass, aniEndName) {
        var _self = this;
        //切出当前页动画
        $currPage.addClass(outClass).on(aniEndName, function () {
            $currPage.off(aniEndName);
            _self._onEndAnimation($currPage, $nextPage, false);
        });
        //切入下一页动画
        $nextPage.addClass(inClass).on(aniEndName, function () {
            $nextPage.off(aniEndName);
            _self._onEndAnimation($currPage, $nextPage, true);
        });
    },
    _onEndAnimation: function ($outpage, $inpage, can_reset) {
        var _self = this;
        if (can_reset) {
            _self.__proto__._isAnimating = false;
            _self._resetPage($outpage, $inpage);
            //第二个页面动画执行回调
            _self.hideLoading();
        }
        return this;
    },
    _resetPage: function ($outpage, $inpage) {
        var _options = this.options;
        $outpage.attr('class', $outpage.data('originalClassList')).removeClass(_options.currClass);
        $inpage.attr('class', $inpage.data('originalClassList')).addClass(_options.currClass);
        return this;
    },
    //获取远程页面
    _getPage: function (isexist, url, $selector) {
        var _self = this;
        if (!isexist) {
            $.ajax({
                url: url, type: 'get', async: false,
                beforeSend: function (jqXHR, settings) {/* _self.showLoading(); */ },
                success: function (data) {
                    $(data).appendTo($selector);
                },
                complete: function (jqXHR, textStatus) {
                    switch (jqXHR.status) {
                        case 200: break;
                        case 404:
                        case 500: _self.hideLoading(); break;
                    }
                }
            });
        }
    },
    showLoading: function () {
        var $loading = $('#app-loading');
        if ($loading.length == 0) {
            $('<div/>', {
                id: 'app-loading',
                css: {
                    'height': '100px',
                    'width': '100px',
                    'position': 'absolute',
                    'left': '50%',
                    'top': '50%',
                    'z-index': '9999',
                    'background': "url('data:image/gif;base64,R0lGODlhIAAgALMAAP///7Ozs/v7+9bW1uHh4fLy8rq6uoGBgTQ0NAEBARsbG8TExJeXl/39/VRUVAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFBQAAACwAAAAAIAAgAAAE5xDISSlLrOrNp0pKNRCdFhxVolJLEJQUoSgOpSYT4RowNSsvyW1icA16k8MMMRkCBjskBTFDAZyuAEkqCfxIQ2hgQRFvAQEEIjNxVDW6XNE4YagRjuBCwe60smQUDnd4Rz1ZAQZnFAGDd0hihh12CEE9kjAEVlycXIg7BAsMB6SlnJ87paqbSKiKoqusnbMdmDC2tXQlkUhziYtyWTxIfy6BE8WJt5YEvpJivxNaGmLHT0VnOgGYf0dZXS7APdpB309RnHOG5gDqXGLDaC457D1zZ/V/nmOM82XiHQjYKhKP1oZmADdEAAAh+QQFBQAAACwAAAAAGAAXAAAEchDISasKNeuJFKoHs4mUYlJIkmjIV54Soypsa0wmLSnqoTEtBw52mG0AjhYpBxioEqRNy8V0qFzNw+GGwlJki4lBqx1IBgjMkRIghwjrzcDti2/Gh7D9qN774wQGAYOEfwCChIV/gYmDho+QkZKTR3p7EQAh+QQFBQAAACwBAAAAHQAOAAAEchDISWdANesNHHJZwE2DUSEo5SjKKB2HOKGYFLD1CB/DnEoIlkti2PlyuKGEATMBaAACSyGbEDYD4zN1YIEmh0SCQQgYehNmTNNaKsQJXmBuuEYPi9ECAU/UFnNzeUp9VBQEBoFOLmFxWHNoQw6RWEocEQAh+QQFBQAAACwHAAAAGQARAAAEaRDICdZZNOvNDsvfBhBDdpwZgohBgE3nQaki0AYEjEqOGmqDlkEnAzBUjhrA0CoBYhLVSkm4SaAAWkahCFAWTU0A4RxzFWJnzXFWJJWb9pTihRu5dvghl+/7NQmBggo/fYKHCX8AiAmEEQAh+QQFBQAAACwOAAAAEgAYAAAEZXCwAaq9ODAMDOUAI17McYDhWA3mCYpb1RooXBktmsbt944BU6zCQCBQiwPB4jAihiCK86irTB20qvWp7Xq/FYV4TNWNz4oqWoEIgL0HX/eQSLi69boCikTkE2VVDAp5d1p0CW4RACH5BAUFAAAALA4AAAASAB4AAASAkBgCqr3YBIMXvkEIMsxXhcFFpiZqBaTXisBClibgAnd+ijYGq2I4HAamwXBgNHJ8BEbzgPNNjz7LwpnFDLvgLGJMdnw/5DRCrHaE3xbKm6FQwOt1xDnpwCvcJgcJMgEIeCYOCQlrF4YmBIoJVV2CCXZvCooHbwGRcAiKcmFUJhEAIfkEBQUAAAAsDwABABEAHwAABHsQyAkGoRivELInnOFlBjeM1BCiFBdcbMUtKQdTN0CUJru5NJQrYMh5VIFTTKJcOj2HqJQRhEqvqGuU+uw6AwgEwxkOO55lxIihoDjKY8pBoThPxmpAYi+hKzoeewkTdHkZghMIdCOIhIuHfBMOjxiNLR4KCW1ODAlxSxEAIfkEBQUAAAAsCAAOABgAEgAABGwQyEkrCDgbYvvMoOF5ILaNaIoGKroch9hacD3MFMHUBzMHiBtgwJMBFolDB4GoGGBCACKRcAAUWAmzOWJQExysQsJgWj0KqvKalTiYPhp1LBFTtp10Is6mT5gdVFx1bRN8FTsVCAqDOB9+KhEAIfkEBQUAAAAsAgASAB0ADgAABHgQyEmrBePS4bQdQZBdR5IcHmWEgUFQgWKaKbWwwSIhc4LonsXhBSCsQoOSScGQDJiWwOHQnAxWBIYJNXEoFCiEWDI9jCzESey7GwMM5doEwW4jJoypQQ743u1WcTV0CgFzbhJ5XClfHYd/EwZnHoYVDgiOfHKQNREAIfkEBQUAAAAsAAAPABkAEQAABGeQqUQruDjrW3vaYCZ5X2ie6EkcKaooTAsi7ytnTq046BBsNcTvItz4AotMwKZBIC6H6CVAJaCcT0CUBTgaTg5nTCu9GKiDEMPJg5YBBOpwlnVzLwtqyKnZagZWahoMB2M3GgsHSRsRACH5BAUFAAAALAEACAARABgAAARcMKR0gL34npkUyyCAcAmyhBijkGi2UW02VHFt33iu7yiDIDaD4/erEYGDlu/nuBAOJ9Dvc2EcDgFAYIuaXS3bbOh6MIC5IAP5Eh5fk2exC4tpgwZyiyFgvhEMBBEAIfkEBQUAAAAsAAACAA4AHQAABHMQyAnYoViSlFDGXBJ808Ep5KRwV8qEg+pRCOeoioKMwJK0Ekcu54h9AoghKgXIMZgAApQZcCCu2Ax2O6NUud2pmJcyHA4L0uDM/ljYDCnGfGakJQE5YH0wUBYBAUYfBIFkHwaBgxkDgX5lgXpHAXcpBIsRADs=') center center no-repeat"
                }
            }).appendTo($('body'));
        } else {
            $loading.show();
        }
    },
    hideLoading: function () {
        var $loading = $('#app-loading');
        $loading.hide();
    }
};