define('app', ['jquery', 'swal', 'jui', 'mask'], function ($, Swal) {
    'use strict';

    var App = (function () {
        return function (config) {
            var body = $('body'),
                userId = null,
                cityId = null,
                shopId = null,
                shopPromptType = null,
                userHash = null,
                userXhr = null,
                pregPatterns = {
                    email: /^([a-zа-я0-9_\.-])+@[a-zа-я0-9-]+\.([a-zа-я]{2,6}\.)?[a-zа-я]{2,6}$/ui,
                    phone: /^\+7\s[\d]{3}\s[\d]{3}\-[\d]{2}\-[\d]{2}$/,
                    string: /^[a-zа-я0-9\s_,%\(\)\-\.]+$/ui,
                    number: /^[\d]+$/,
                    json: /^(\{.+\}|\[.+\])$/ui,
                    date: /^(0?[1-9]|[12]\d|3[01])[\.](0?[1-9]|1[0-2])[\.](19|20)\d{2}$/,
                    any: /^.+$/ui
                },
                _config = {
                    debug: appEnv !== 'prod',
                    skipAjaxErrors: false,
                    imagePlug: appCdn + '/assets/images/plug-dish.svg',
                    currencySymbol: '₽',
                    currencyDecimals: 0,
                    thousandSeparator: ' ',
                    decimalSeparator: ','
                };

            if (typeof config !== "undefined") {
                for (var key in config) {
                    if (key in _config) {
                        _config[key] = config[key];
                    }
                }
            }

            /**
             * Возвращает отформатированный объект в виде строки
             * @param obj Объект
             * @param level Уровень объект
             * @returns {string}
             */
            var varDump = function (obj, level) {

                if (typeof obj === "string") {
                    return obj;
                } else if (typeof obj === "number") {
                    return obj.toString();
                } else if (typeof obj !== "object") {
                    return '';
                }

                if (typeof level === "undefined") {
                    level = 1;
                }

                var tab = "",
                    string = "";

                for (var j = 0; j < level; j++) {
                    tab += " ";
                }

                string += "{\n";

                Object.entries(obj).forEach(([key, value]) => {
                    string += tab + "'" + key + "': ";
                    switch (typeof value) {
                        case "object":
                            string += varDump(value, level + 1);
                            break;
                        case "string":
                            string += "'" + value + "'";
                            break;
                        case "number":
                            string += value;
                            break;
                        default:
                            string += '';
                            break;
                    }

                    string += "\n";
                });

                return string + tab + "}";
            };

            /**
             * Копирует объект через json
             * @param obj
             */
            var jsonCopy = function (obj) {
                return JSON.parse(JSON.stringify(obj));
            };

            /**
             * Проверяет, находится ли элемент над другим элементом
             * @param target1 Селектор 1
             * @param target2 Селектор 2
             * @param offset Объект со смещениями top и left
             * @return {boolean}
             */
            var isTargetOnTarget = function (target1, target2, offset) {
                var element1 = document.querySelector(target1),
                    target1Position = {
                        top: window.pageYOffset + element1.getBoundingClientRect().top,
                        left: window.pageXOffset + element1.getBoundingClientRect().left,
                        right: window.pageXOffset + element1.getBoundingClientRect().right,
                        bottom: window.pageYOffset + element1.getBoundingClientRect().bottom
                    },
                    element2 = document.querySelector(target2),
                    target2Position = {
                        top: window.pageYOffset + element2.getBoundingClientRect().top,
                        left: window.pageXOffset + element2.getBoundingClientRect().left,
                        right: window.pageXOffset + element2.getBoundingClientRect().right,
                        bottom: window.pageYOffset + element2.getBoundingClientRect().bottom
                    };

                if (target1Position.bottom > target2Position.top && // Если позиция нижней части элемента больше позиции верхней чайти окна, то элемент виден сверху
                    target1Position.top < target2Position.bottom && // Если позиция верхней части элемента меньше позиции нижней чайти окна, то элемент виден снизу
                    target1Position.right > target2Position.left && // Если позиция правой стороны элемента больше позиции левой части окна, то элемент виден слева
                    target1Position.left < target2Position.right) { // Если позиция левой стороны элемента меньше позиции правой чайти окна, то элемент виден справа

                    if (typeof offset == "object") {
                        offset.top = target1Position.bottom - target2Position.top;
                        offset.left = target1Position.left - target2Position.left;
                    }

                    return true;
                } else {
                    return false;
                }
            };

            /**
             * Проверяет, находится ли элемент в видимости окна
             * @param target Селектор
             * @return {boolean}
             */
            var isVisible = function (target) {
                // Все позиции элемента
                var element = document.querySelector(target),
                    targetPosition = {
                        top: window.pageYOffset + element.getBoundingClientRect().top,
                        left: window.pageXOffset + element.getBoundingClientRect().left,
                        right: window.pageXOffset + element.getBoundingClientRect().right,
                        bottom: window.pageYOffset + element.getBoundingClientRect().bottom
                    },
                    // Получаем позиции окна
                    windowPosition = {
                        top: window.pageYOffset,
                        left: window.pageXOffset,
                        right: window.pageXOffset + document.documentElement.clientWidth,
                        bottom: window.pageYOffset + document.documentElement.clientHeight
                    };

                if (targetPosition.bottom > windowPosition.top && // Если позиция нижней части элемента больше позиции верхней чайти окна, то элемент виден сверху
                    targetPosition.top < windowPosition.bottom && // Если позиция верхней части элемента меньше позиции нижней чайти окна, то элемент виден снизу
                    targetPosition.right > windowPosition.left && // Если позиция правой стороны элемента больше позиции левой части окна, то элемент виден слева
                    targetPosition.left < windowPosition.right) { // Если позиция левой стороны элемента меньше позиции правой чайти окна, то элемент виден справа
                    // Если элемент полностью видно, то запускаем следующий код
                    return true;
                } else {
                    // Если элемент не видно, то запускаем этот код
                    return false;
                }
            };

            /**
             * Возвращает склонение для числа
             * @param {number} int         Число
             * @param {object}  expressions Варианты сколения
             * @param {boolean} showint     TRUE если нужно вернуть склонение с числом
             * @return {string}
             */
            var declension = function (int, expressions, showint) {
                if (typeof int == "undefined" || typeof expressions == "undefined")
                    return '';

                if (typeof showint == "undefined")
                    showint = true;

                var count = 0,
                    result = '';

                count = int % 100;
                if (count >= 5 && count <= 20) {
                    result = (showint ? int.toString() + " " : "") + expressions[2];
                } else {
                    count = count % 10;
                    if (count == 1) {
                        result = (showint ? int.toString() + " " : "") + expressions[0];
                    } else if (count >= 2 && count <= 4) {
                        result = (showint ? int.toString() + " " : "") + expressions[1];
                    } else {
                        result = (showint ? int.toString() + " " : "") + expressions[2];
                    }
                }

                return result;
            };

            /**
             * Форматирует число
             * @param {number} number Число
             * @param {number} decimals Кол-во знаков после запятой
             * @param {string} dec_point Разделитель целых
             * @param {string} thousands_sep Разделитель тысяч
             * @return {string}
             */
            var numberFormat = function (number, decimals, dec_point, thousands_sep) {	// Format a number with grouped thousands
                //
                // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
                // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // +	 bugfix by: Michael White (http://crestidg.com)

                var i, j, kw, kd, km;

                // input sanitation & defaults
                if (isNaN(decimals = Math.abs(decimals))) {
                    decimals = 2;
                }
                if (dec_point == undefined) {
                    dec_point = ",";
                }
                if (thousands_sep == undefined) {
                    thousands_sep = ".";
                }

                i = parseInt(number = (+number || 0).toFixed(decimals)) + "";

                if ((j = i.length) > 3) {
                    j = j % 3;
                } else {
                    j = 0;
                }

                km = (j ? i.substr(0, j) + thousands_sep : "");
                kw = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
                //kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).slice(2) : "");
                kd = (decimals ? dec_point + Math.abs(number - i).toFixed(decimals).replace(/-/, 0).slice(2) : "");


                return km + kw + kd;
            };

            /**
             * Возвращает ID пользователя
             * @returns {int}
             */
            var getUserId = function () {
                if (userId === null) {
                    userId = body.attr('data-guest');
                    if (typeof userId !== "string" || userId.length == 0) {
                        userId = 0;
                    } else {
                        userId = +userId;
                    }
                }

                return userId;
            };

            /**
             * Возвращает ID города
             * @returns {int}
             */
            var getCityId = function () {
                if (cityId === null) {
                    cityId = body.attr('data-city');
                    if (typeof cityId !== "string" || cityId.length == 0) {
                        cityId = 0;
                    } else {
                        cityId = +cityId;
                    }
                }

                return cityId;
            };

            /**
             * Возвращает ID заведения
             * @returns {int}
             */
            var getShopId = function () {
                if (shopId === null) {
                    shopId = body.attr('data-shop');
                    if (typeof shopId !== "string" || shopId.length == 0) {
                        shopId = 0;
                    } else {
                        shopId = +shopId;
                    }
                }

                return shopId;
            };

            /**
             * Возвращает тип запроса привязки заведения
             * @returns {string}
             */
            var getShopPromptType = function () {
                if (shopPromptType === null) {
                    shopPromptType = body.attr('data-shop-prompt');
                    if (typeof shopPromptType !== "string" || shopPromptType.length == 0) {
                        shopPromptType = 'off';
                    }
                }

                return shopPromptType;
            };

            /**
             * Возвращает уникальный хэш пользователя
             * @returns {string}
             */
            var getUserHash = function () {
                if (userHash === null) {
                    userHash = body.attr('data-hash');
                    if (typeof userHash !== "string" || userHash.length !== 32) {
                        userHash = null;
                    }
                }

                return userHash;
            };

            /**
             * Возвращает уникальный хэш xhr
             * @returns {int}
             */
            var getXhrHash = function () {
                if (userXhr === null) {
                    userXhr = body.attr('data-xhr');
                    if (typeof userXhr !== "string" || userXhr.length == 0) {
                        userXhr = null;
                    }
                }

                return userXhr;
            };

            /**
             * Опеределяет координаты пользователя и возвращает результат в функции
             * @param done
             */
            var userLocate = function (done) {
                if (typeof done !== "function") {
                    return;
                }

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        done(position.coords);
                    }, function (error) {
                        if (_config.debug) {
                            console.warn(`ERROR(${error.code}): ${error.message}`);
                        }
                        done();
                    }, {
                        enableHighAccuracy: true,
                        timeout: 3000,
                        maximumAge: 0
                    });
                } else {
                    done();
                }
            };

            /**
             * Проверяет, является ли пользователь аутентифицированным
             * @returns {boolean}
             */
            var isUserAuth = function () {
                return getUserId() > 0;
            };

            /**
             * Отправляет событие в счетчики
             * @param event Код события
             */
            var trackEvent = function (event) {
                var events = {
                        CALLBACK_WINDOW_OPENED: {
                            category: 'Обратный звонок',
                            action: 'Открыто окно обратного звонка'
                        },
                        CALLBACK_SEND: {
                            category: 'Обратный звонок',
                            action: 'Отправлен номер телефона для обратного звонка'
                        },
                        AUTH_WINDOW_OPENED: {
                            category: 'Авторизация',
                            action: 'Открыто окно авторизации'
                        },
                        AUTH_SEND: {
                            category: 'Авторизация',
                            action: 'Отправлен пин-код для авторизации'
                        },
                        AUTH_RESEND: {
                            category: 'Авторизация',
                            action: 'Повторно отправлен пин-код для авторизации'
                        },
                        AUTH_CONFIRMED: {
                            category: 'Авторизация',
                            action: 'Телефон подтвержден'
                        },
                        CART_ADD: {
                            category: 'Корзина',
                            action: 'Добавлен продукт в корзину'
                        }
                    },
                    ymCode = body.attr('data-ym');

                if (typeof event !== "string" || typeof events[event] !== "object") {
                    return false;
                }

                try {
                    ym(ymCode, 'reachGoal', event);
                } catch (e) {
                    console.log(e);
                }

                try {
                    gtag('event', event);
                } catch (e) {
                    console.log(e);
                }
            };

            /**
             * Отправляет событие посещения страницы в счетчики
             * @param path Путь страницы
             */
            var pageView = function (path) {
                try {
                    ym(body.attr('data-ym'), 'hit', path);
                } catch (e) {
                    console.log(e);
                }

            };

            /**
             * Height 100 vh
             */
            var autoVh = function () {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };

            /**
             * Устанавливает режим скролла боди
             * @param scroll
             */
            var bodyScroll = function (scroll) {
                if (typeof scroll !== "boolean") {
                    scroll = true;
                }

                if (scroll) {
                    if (!products.windowOpened && body.hasClass('noscroll')) {
                        body.removeClass('noscroll');
                    }
                } else {
                    if (!body.hasClass('noscroll')) {
                        body.addClass('noscroll');
                    }
                }

                autoVh();
            };

            /**
             * Устанавливает режим фиксации боди
             * @param freeze
             */
            var bodyFreeze = function (freeze) {
                if (!isTouchDevice()) {
                    return;
                }

                if (typeof freeze !== "boolean") {
                    freeze = false;
                }

                if (freeze) {
                    if (!body.hasClass('freeze')) {
                        body.addClass('freeze');
                    }
                } else {
                    if (!products.windowOpened && body.hasClass('freeze')) {
                        body.removeClass('freeze');
                    }
                }

                autoVh();
            };

            /**
             * Тач устройство
             * @return {boolean}
             */
            var isTouchDevice = function () {
                return (('ontouchstart' in window) ||
                    (navigator.maxTouchPoints > 0) ||
                    (navigator.msMaxTouchPoints > 0));
            };

            //Привязка заведения
            var shop = {
                init: function () {
                    if (getShopPromptType() == 'off') {
                        return;
                    }

                    shop.window = $('#shops-window');
                    shop.windowOpened = false;

                    if (shop.window.length == 0) {
                        return;
                    }

                    $('.header_city.c-pointer').on('click', function () {
                        shop.scroller = $(this).closest('.hidescroll');

                        if (shop.windowOpened) {
                            shop.closeWindow();
                        } else {
                            shop.openWindowInit();
                        }
                    });

                    shop.window.find('.close-cross').on('click', function () {
                        shop.closeWindow();
                    });

                    if (getShopId() === 0) {
                        shop.openWindowInit();
                    }
                },
                openWindowInit: function () {
                    if (getShopPromptType() == 'shop-geo') {
                        userLocate(shop.loadShops);
                    } else {
                        shop.loadShops();
                    }
                },
                onBodyClick: function (event) {
                    var panel = shop.window.find('.window_panel');

                    if (shop.windowOpened) {
                        if (!panel.is(event.target)
                            && panel.has(event.target).length === 0) {
                            shop.closeWindow();
                        }
                    }

                    shop.firstEvent = true;
                },
                drawResults: function (list) {
                    if (typeof list !== "object") {
                        return;
                    }

                    var html = '',
                        isFirst = true,
                        promptType = getShopPromptType();

                    for (var cityId in list) {
                        var city = list[cityId]

                        html += '<div class="sws_block">';
                        html += '<div class="sws_title"><div class="text">' + city[0]['city'] + '</div></div>';
                        html += '<div class="sws_list">';

                        for (var key in city) {
                            var item = city[key],
                                isSelected = item['selected'],
                                isLocated = typeof item['distance'] == "number";

                            html += '<div class="sws_shop' + (isSelected ? ' selected' : '') + '"' + (isFirst && isLocated ? ' title="Ближайшее заведение"' : '') + ' data-id="' + item['id'] + '">';
                            html += '<div class="swss_name">' + item['name'] + '</div>';
                            html += '<div class="swss_addr">' + item['street'] + ', ' + item['house'] + '</div>';
                            html += '<div class="swss_wrapper"></div>';
                            html += '<div class="swss_time">' + (item['is_open'] ? item['working_time'] : 'Закрыто') + '</div>';
                            html += '</div>';
                            isFirst = false;
                        }

                        html += '</div></div>';
                    }

                    shop.window.find('.shops_window .sw_shops').html(html)
                        .find('.sws_shop:not(.selected)').on('click', function () {
                        if (typeof $(this).attr('data-id') == "string") {
                            window.location = '/profile/shop?id=' + $(this).attr('data-id');
                        }
                    });
                },
                loadShops: function (location) {
                    var data = {
                        id: getShopId(),
                        xhr: getXhrHash()
                    };

                    if (typeof location !== "undefined") {
                        data.lat = location.latitude;
                        data.lon = location.longitude;
                    }

                    $.ajax('/profile/pickup-shops', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: data,
                        success: function (data) {
                            if (typeof data === "undefined") {
                                return false;
                            }
                            shop.drawResults(data);
                            shop.openWindow();
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                    });
                },
                openWindow: function () {
                    if (navigation.opened) {
                        navigation.close(true);
                    }

                    shop.scrollTop = navigation.opened ? navigation.scrollTop
                        : $(window).scrollTop();
                    shop.firstEvent = false;

                    bodyScroll(false);
                    body.on('click', shop.onBodyClick);

                    shop.window.addClass('opened').animate({opacity: 1}, 100, function () {
                        bodyFreeze(true);
                    });
                    shop.windowOpened = true;
                },
                closeWindow: function (force) {
                    if (typeof force === "undefined") {
                        force = false;
                    }

                    if (force) {
                        shop.window.css({opacity: 0}).removeClass('opened');
                    } else {
                        shop.window.animate({opacity: 0}, 100, function () {
                            $(this).removeClass('opened');
                        });
                    }

                    shop.windowOpened = false;

                    body.off('click', shop.onBodyClick);
                    bodyFreeze(false);
                    bodyScroll(true);
                    $(window).scrollTop(shop.scrollTop);
                },
            };

            //Выбор города
            var city = {
                init: function () {
                    if (getShopPromptType() !== 'off') {
                        return;
                    }

                    city.window = $('#city-window');
                    city.input = city.window.find('.cw_search');
                    city.result = city.window.find('.cw_result');
                    city.cities = [];
                    city.menu = $('#city-dropdown');

                    city.windowOpened = false;
                    city.menuOpened = false;

                    $('.header_city.c-pointer').on('click', function () {
                        city.totalCities = parseInt($(this).attr('data-cities'));
                        city.initiator = $(this);
                        city.scroller = $(this).closest('.hidescroll');

                        if (city.totalCities < 10) {
                            if (city.menuOpened) {
                                city.closeMenu();
                            } else {
                                city.openMenu();
                            }
                        } else {
                            if (city.windowOpened) {
                                city.closeWindow();
                            } else {
                                city.openWindow();
                            }
                        }
                    });

                    city.window.find('.close-cross').on('click', function () {
                        city.closeWindow();
                    });

                },
                onBodyClick: function (event) {
                    var panel = city.window.find('.window_panel');

                    if (city.menuOpened) {
                        if (city.firstEvent
                            && !city.menu.is(event.target)
                            && city.menu.has(event.target).length === 0) {
                            city.closeMenu();
                        }
                    }

                    if (city.windowOpened) {
                        if (city.firstEvent
                            && !panel.is(event.target)
                            && panel.has(event.target).length === 0) {
                            city.closeWindow();
                        }
                    }

                    city.firstEvent = true;
                },
                onWindowResize: function () {
                    if (city.menuOpened) {
                        city.closeMenu(true);
                    }
                },
                drawWindowResults: function (list) {
                    if (typeof list !== "object") {
                        return;
                    }

                    var html = '';

                    for (var letter in list) {
                        var block = list[letter];

                        html += '<div class="cwr_group">';
                        html += '<div class="cwr_letter">' + letter + '</div>';

                        for (var i in block) {
                            var item = block[i];

                            if (item.selected) {
                                html += '<div class="cwr_item selected">' + item.name + '</div>'
                            } else {
                                html += '<a class="cwr_item" href="/profile/city?id=' + item.id + '">' + item.name + '</a>'
                            }
                        }

                        html += '</div>';
                    }

                    city.result.html(html);
                },
                searchCities: function (query) {
                    if (typeof query !== "string") {
                        query = '';
                    } else {
                        query = query.toLowerCase();
                    }

                    var result = [];

                    for (var i in city.cities) {
                        var item = city.cities[i],
                            name = item.name.toLowerCase(),
                            letter = name[0].toUpperCase();

                        if (query.length === 0 || name.indexOf(query) > -1) {
                            if (typeof result[letter] === "undefined") {
                                result[letter] = [];
                            }

                            result[letter].push(item);
                        }
                    }

                    return result;
                },
                onInputChange: function () {
                    city.drawWindowResults(city.searchCities($(this).val()));
                },
                openWindow: function () {
                    if (typeof city.initiator === "undefined") {
                        return;
                    }

                    if (navigation.opened) {
                        navigation.close(true);
                    }

                    city.cities = JSON.parse(city.result.attr('data-cities'));
                    city.scrollTop = navigation.opened ? navigation.scrollTop
                        : $(window).scrollTop();
                    city.firstEvent = false;

                    bodyScroll(false);
                    body.on('click', city.onBodyClick);

                    var promise = new Promise(function (resolve, reject) {
                        city.input.on('keyup', city.onInputChange).trigger('keyup');
                    });
                    city.window.addClass('opened').animate({opacity: 1}, 100, function () {
                        city.input.focus();
                        bodyFreeze(true);
                    });
                    city.windowOpened = true;
                },
                closeWindow: function (force) {
                    if (typeof force === "undefined") {
                        force = false;
                    }

                    if (force) {
                        city.window.css({opacity: 0}).removeClass('opened');
                    } else {
                        city.window.animate({opacity: 0}, 100, function () {
                            $(this).removeClass('opened');
                            city.result.html('');
                            city.input.val('');
                        });
                    }

                    city.windowOpened = false;
                    city.input.off('keyup');

                    body.off('click', city.onBodyClick);
                    bodyFreeze(false);
                    bodyScroll(true);
                    $(window).scrollTop(city.scrollTop);
                },
                openMenu: function () {
                    if (typeof city.initiator === "undefined") {
                        return;
                    }

                    var posTop = city.initiator.offset().top + city.initiator.outerHeight() + 8 - $(window).scrollTop(),
                        posLeft = city.initiator.offset().left,
                        selectorWidth = city.initiator.outerWidth(),
                        selectorOverflow = posTop + city.menu.outerHeight() > $(window).height();

                    city.firstEvent = false;

                    body.on('click', city.onBodyClick);
                    $(window).resize(city.onWindowResize);
                    city.scroller.on('scroll', city.onWindowResize);

                    city.menu.css({
                        top: posTop,
                        left: posLeft,
                        bottom: selectorOverflow ? 20 : 'auto',
                        width: selectorWidth
                    }).addClass('overflow-scroll-y').addClass('hidescroll');

                    city.menu.addClass('opened').animate({opacity: 1}, 100);
                    city.menuOpened = true;
                },
                closeMenu: function (force) {
                    if (typeof force === "undefined") {
                        force = false;
                    }

                    city.menu.css({
                        bottom: 'auto',
                    }).removeClass('overflow-scroll-y').removeClass('hidescroll');

                    if (force) {
                        city.menu.css({opacity: 0}).removeClass('opened');
                    } else {
                        city.menu.animate({opacity: 0}, 100, function () {
                            $(this).removeClass('opened');
                        });
                    }

                    city.menuOpened = false;
                    body.off('click', city.onBodyClick);
                    $(window).off('resize', city.onWindowResize);
                    city.scroller.off('scroll', city.onWindowResize);
                }
            };

            //Навигация
            var navigation = {
                init: function () {
                    navigation.nav = $('#navigation');
                    navigation.bodyNav = $('.body_nav .nav_menu');
                    navigation.headerNav = $('.header_nav .hm_wrapper');
                    navigation.header = $('.header');
                    navigation.hamburger = navigation.header.find('.header_hamburger');
                    navigation.opened = false;
                    navigation.scrollTop = 0;

                    if (navigation.nav.length == 0 || navigation.header.length == 0
                        || navigation.hamburger.length == 0) {
                        return;
                    }

                    navigation.hamburger.on('click', function () {
                        navigation.open();
                    });

                    navigation.nav.find('.close-block').on('click', function () {
                        navigation.close();
                    });

                    if (navigation.bodyNav.length > 0) {
                        $(window).on('resize', navigation.navAutoHeight)
                            .on('scroll', navigation.navAutoHeight);
                        navigation.navAutoHeight();
                    }

                    if (navigation.headerNav.length > 0) {
                        navigation.headerNavPositioning();
                    }

                },
                headerNavPositioning: function () {
                    var item = navigation.headerNav.find('.selected');
                    if (item.length == 0) {
                        return false;
                    }

                    var wrapper = item.parent(),
                        wrapperWidth = wrapper.width(),
                        itemPosition = item.position(),
                        itemWidth = item.outerWidth(true),
                        itemOffset = itemPosition.left + itemWidth,
                        itemLeft = 0;

                    if (itemPosition.left < 0 || itemOffset > wrapperWidth) {
                        wrapper.find('.hm_item').each(function () {
                            if ($(this).hasClass('selected')) {
                                return false;
                            }
                            itemLeft += $(this).outerWidth(true);
                        });
                        wrapper.animate({scrollLeft: itemLeft - ((wrapperWidth / 2) - (itemWidth / 2))}, 100);
                    }
                },
                navAutoHeight: function () {
                    var bodyMarg = parseInt($('.body').css('margin-top')),
                        windowHeight = $(window).height(),
                        footerHeight = $('.footer').outerHeight(),
                        containerHeight = navigation.bodyNav.height('auto').outerHeight(),
                        availableHeight = windowHeight - navigation.header.outerHeight() - bodyMarg * 2,
                        newHeight = availableHeight - 20,
                        navFooterOffset = {left: 0, top: 0},
                        isTarget = isTargetOnTarget('.body_nav .nav_menu', '.footer', navFooterOffset),
                        isFooterShift = windowHeight > footerHeight * 3 && isTarget;

                    if (isFooterShift) {
                        navigation.bodyNav.height(containerHeight - navFooterOffset.top - bodyMarg * 2);
                    } else {
                        if (availableHeight > containerHeight) {
                            navigation.bodyNav.height('auto');
                        } else {
                            navigation.bodyNav.height(newHeight);
                        }
                    }
                },
                onBodyClick: function (event) {
                    var panel = navigation.nav.find('.nav_panel');
                    if (navigation.firstEvent
                        && !city.menu.is(event.target)
                        && city.menu.has(event.target).length === 0
                        && !panel.is(event.target)
                        && panel.has(event.target).length === 0) {
                        navigation.close();
                    }
                    navigation.firstEvent = true;
                },
                open: function () {

                    navigation.scrollTop = $(window).scrollTop();
                    navigation.firstEvent = false;

                    body.on('click', navigation.onBodyClick);

                    bodyScroll(false);
                    navigation.nav.addClass('opened').animate({opacity: 1}, 100, function () {
                        navigation.hamburger.addClass('opened');
                        navigation.opened = true;
                        bodyFreeze(true);
                    });

                },
                close: function (force) {
                    if (typeof force === "undefined") {
                        force = false;
                    }

                    if (force) {
                        navigation.nav.css({opacity: 0}).removeClass('opened');
                    } else {
                        navigation.nav.animate({opacity: 0}, 100, function () {
                            $(this).removeClass('opened');
                        });
                    }

                    if (city.menuOpened) {
                        city.closeMenu(force);
                    }

                    navigation.hamburger.removeClass('opened');
                    navigation.opened = false;
                    body.off('click', navigation.onBodyClick);
                    bodyFreeze(false);
                    bodyScroll(true);

                    $(window).scrollTop(navigation.scrollTop);
                }
            };

            //Обратный звонок
            var callback = {
                init: function () {
                    callback.window = $('#callback-window');
                    callback.input = callback.window.find('input').mask('+7 000 000-00-00');
                    callback.submit = callback.window.find('.btn');
                    callback.opened = false;
                    callback.sending = false;

                    if (callback.window.length == 0 || callback.input.length == 0 || callback.submit.length == 0) {
                        return;
                    }

                    $('.footer_phone .phone:not(.offservice), .header_phone:not(.offservice)').on('click', function () {
                        callback.initiator = $(this);
                        if (callback.opened) {
                            callback.close();
                        } else {
                            callback.open();
                        }
                    });

                    callback.window.find('.close-cross').on('click', function () {
                        callback.close();
                    });

                },
                onBodyClick: function (event) {
                    var panel = callback.window.find('.window_panel'),
                        swalc = $('.swal2-container');

                    if (callback.firstEvent
                        && !swalc.is(event.target)
                        && swalc.has(event.target).length === 0
                        && !panel.is(event.target)
                        && panel.has(event.target).length === 0) {
                        callback.close();
                    }
                    callback.firstEvent = true;
                },
                onInputChange: function () {
                    if (pregPatterns.phone.test(callback.input.val())) {
                        callback.submit.removeClass('disabled');
                    } else {
                        callback.submit.addClass('disabled');
                    }
                },
                send: function () {
                    if (callback.submit.hasClass('disabled') || callback.sending) {
                        return false;
                    }

                    $.ajax('/profile/callback/send', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            phone: callback.input.val().replace(/[^\d]+/g, ''),
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            callback.sending = true;
                            callback.input.prop('disabled', true);
                            callback.submit.addClass('disabled');
                        },
                        success: function () {
                            callback.window.find('.callback').addClass('d-none');
                            callback.window.find('.callback-success').removeClass('d-none');
                            trackEvent('CALLBACK_SEND');
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (_config.skipAjaxErrors) {
                                this.success();
                                return true;
                            }
                            if (typeof xhr['responseJSON'] !== "undefined" && xhr.status == 403) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка во время отправки сообщения. Попробуйте позже',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                        },
                        complete: function () {
                            callback.input.prop('disabled', false);
                            callback.submit.removeClass('disabled');
                            callback.sending = false;
                        }
                    });
                },
                open: function () {
                    if (typeof callback.initiator === "undefined") {
                        return;
                    }

                    if (navigation.opened) {
                        navigation.close(true);
                    }

                    callback.scrollTop = navigation.opened ? navigation.scrollTop
                        : $(window).scrollTop();
                    callback.firstEvent = false;

                    bodyScroll(false);
                    body.on('click', callback.onBodyClick);

                    callback.input.on('keyup', callback.onInputChange).on('keypress', function (event) {
                        if (event.keyCode == 13) {
                            callback.send();
                        }
                    });

                    callback.submit.addClass('disabled').on('click', callback.send);
                    callback.window.addClass('opened').animate({opacity: 1}, 100, function () {
                        callback.input.focus();
                        bodyFreeze(true);
                    });
                    callback.opened = true;
                    trackEvent('CALLBACK_WINDOW_OPENED');
                },
                close: function () {

                    if (callback.sending) {
                        return;
                    }

                    callback.window.animate({opacity: 0}, 100, function () {
                        $(this).removeClass('opened');
                        callback.window.find('.callback').removeClass('d-none');
                        callback.window.find('.callback-success').addClass('d-none');
                        callback.submit.removeClass('disabled').off('click');
                        callback.input.val('');
                    });

                    callback.opened = false;
                    callback.input.off('keyup').off('keypress');

                    body.off('click', callback.onBodyClick);
                    bodyFreeze(false);
                    bodyScroll(true);
                    $(window).scrollTop(callback.scrollTop);
                }
            };

            //Авторизация
            var auth = {
                init: function () {
                    auth.changePhone = false;

                    auth.window = $('#auth-window');
                    auth.isCall = auth.window.hasClass('sms_call');
                    auth.phoneInput = auth.window.find('.signin input').mask('+7 000 000-00-00');

                    auth.codeInput = auth.window.find('.pincode .code-input').mask('0000');
                    auth.codeFail = auth.window.find('.pincode .code-fail');

                    auth.codePanel = auth.window.find('.pincode .code-panel');
                    auth.codeDigits = auth.codePanel.find('.digit');

                    auth.sendBtn = auth.window.find('.btn');
                    auth.resendBtn = auth.window.find('.pincode .resend');
                    auth.wrongBtn = auth.window.find('.pincode .wrong-number');

                    auth.windowOpened = false;
                    auth.sending = false;

                    auth.resendTimestamp = -1;
                    auth.resendInterval = null;

                    if (auth.window.length == 0
                        || auth.phoneInput.length == 0 || auth.codeInput.length == 0
                        || auth.sendBtn.length == 0 || auth.resendBtn.length == 0
                        || auth.wrongBtn.length == 0) {
                        return;
                    }

                    $('.header_user, .navigation_user').on('click', function () {
                        if ($(this).hasClass('active') || $(this).hasClass('disabled')) {
                            return false;
                        }

                        auth.initiator = $(this);
                        if (isUserAuth()) {
                            window.location = '/profile';
                        } else {
                            if (auth.windowOpened) {
                                auth.closeWindow();
                            } else {
                                auth.openWindow();
                            }
                        }
                    });

                    auth.window.find('.close-cross').on('click', function () {
                        auth.closeWindow();
                    });

                },
                onBodyClick: function (event) {
                    var panel = auth.window.find('.window_panel'),
                        swalc = $('.swal2-container');

                    if (auth.windowOpened) {
                        if (auth.firstEvent
                            && !swalc.is(event.target)
                            && swalc.has(event.target).length === 0
                            && !panel.is(event.target)
                            && panel.has(event.target).length === 0) {
                            auth.closeWindow();
                        }
                    }

                    auth.firstEvent = true;
                },
                onPhoneInputChange: function () {
                    if (pregPatterns.phone.test(auth.phoneInput.val())) {
                        auth.sendBtn.removeClass('disabled');
                    } else {
                        auth.sendBtn.addClass('disabled');
                    }
                },
                onCodeInputsChange: function () {
                    if (auth.codeFail.html().length > 0) {
                        auth.codeFail.html('');
                        auth.codeDigits.removeClass('invalid');
                    }

                    var val = $(this).val(),
                        count = 0;

                    if (val.length == 0) {
                        auth.codeDigits.html('').removeClass('invalid');
                        return true;
                    }

                    auth.codeDigits.html('');
                    auth.codeDigits.each(function () {
                        if (count > val.length - 1) {
                            return false;
                        }

                        $(this).html(val.charAt(count));
                        count++;
                    });

                    if (val.length == 4) {
                        setTimeout(function () {
                            auth.confirmCode();
                        }, 50);
                    }
                },
                onResendInterval: function () {
                    var currentStamp = auth.resendTimestamp - Date.now(),
                        seconds = Math.round(currentStamp / 1000),
                        count = auth.resendBtn.find('.count');

                    count.html('через ' + declension(seconds, ['секунду', 'секунды', 'секунд']));

                    if (currentStamp <= 1) {
                        clearInterval(auth.resendInterval);
                        count.html('');
                        auth.resendBtn.removeClass('disabled');
                    }
                },
                wrongNumber: function () {
                    clearInterval(auth.resendInterval);
                    auth.window.find('.pincode').addClass('d-none');
                    auth.window.find('.signin').removeClass('d-none').find('input').focus();
                },
                sendCode: function () {
                    if (auth.sendBtn.hasClass('disabled') || auth.sending) {
                        return false;
                    }

                    var path = auth.changePhone ? '/profile/phone/change' : '/profile/login/send';
                    $.ajax(path, {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            phone: auth.phoneInput.val().replace(/[^\d]+/g, ''),
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            auth.sending = true;
                            auth.phoneInput.prop('disabled', true);
                            auth.sendBtn.addClass('disabled');
                        },
                        success: function () {
                            auth.resendBtn.addClass('disabled').find('.count').html('через 60 секунд');
                            auth.resendTimestamp = Date.now() + 60000;
                            auth.resendInterval = setInterval(auth.onResendInterval, 1000);

                            auth.window.find('.signin').addClass('d-none');
                            auth.window.find('.pincode').removeClass('d-none');
                            auth.codeInput.val('').focus();
                            trackEvent('AUTH_SEND');
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (_config.skipAjaxErrors) {
                                this.success();
                                return true;
                            }
                            if (typeof xhr['responseJSON'] !== "undefined" && xhr.status == 403) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка отправки пин-кода. Попробуйте позже',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                        },
                        complete: function () {
                            auth.sending = false;
                            auth.phoneInput.prop('disabled', false);
                            auth.sendBtn.removeClass('disabled');
                        }
                    });
                },
                resendCode: function () {
                    if (auth.resendBtn.hasClass('disabled') || auth.sending) {
                        return false;
                    }

                    var path = auth.changePhone ? '/profile/phone/change' : '/profile/login/send';
                    $.ajax(path, {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            phone: auth.phoneInput.val().replace(/[^\d]+/g, ''),
                            resend: 1,
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            auth.sending = true;
                            auth.codeInput.prop('disabled', true).val('');
                            auth.resendBtn.addClass('disabled');
                        },
                        success: function () {
                            auth.resendBtn.addClass('disabled').find('.count').html('через 60 секунд');
                            auth.resendTimestamp = Date.now() + 60000;
                            auth.resendInterval = setInterval(auth.onResendInterval, 1000);
                            auth.codeInput.focus();
                            trackEvent('AUTH_RESEND');
                        },
                        error: function (xhr) {
                            auth.resendBtn.removeClass('disabled');
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (_config.skipAjaxErrors) {
                                this.success();
                                return true;
                            }
                            if (typeof xhr['responseJSON'] !== "undefined" && xhr.status == 403) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка отправки пин-кода. Попробуйте позже',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                        },
                        complete: function () {
                            auth.sending = false;
                            auth.codeInput.prop('disabled', false).focus();
                        }
                    });
                },
                confirmCode: function (done) {
                    var code = auth.codeInput.val();
                    if (code.length != 4) {
                        return false;
                    }

                    var path = auth.changePhone ? '/profile/phone/change/confirm' : '/profile/login';
                    $.ajax(path, {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            phone: auth.phoneInput.val().replace(/[^\d]+/g, ''),
                            code: code,
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            auth.sending = true;
                            auth.codeInput.prop('disabled', true);
                            auth.resendBtn.addClass('disabled');
                            auth.codeFail.html('');
                        },
                        success: function (data) {
                            trackEvent('AUTH_CONFIRMED');
                            setTimeout(function () {
                                if (typeof auth.doneAuth === "function") {
                                    auth.sending = false;
                                    auth.closeWindow();
                                    auth.doneAuth(data);
                                } else {
                                    window.location = '/profile';
                                }
                            }, 100);
                        },
                        error: function (xhr) {
                            if (auth.resendBtn.find('.count').length == 0) {
                                auth.resendBtn.removeClass('disabled');
                            }

                            auth.codeInput.prop('disabled', false).val('').focus();
                            auth.codeDigits.html('').addClass('invalid');

                            if (xhr.status == 401) {
                                auth.codeFail.html('Неправильный пин-код');
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка авторизации. Попробуйте позже',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }

                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                        complete: function () {
                            auth.sending = false;
                        }
                    });
                },
                openWindow: function (done) {
                    if (typeof auth.initiator === "undefined") {
                        return;
                    }

                    auth.scrollTop = navigation.opened ? navigation.scrollTop
                        : $(window).scrollTop();
                    auth.firstEvent = false;
                    auth.doneAuth = done;

                    bodyScroll(false);
                    body.on('click', auth.onBodyClick);

                    auth.window.find('.pincode').on('click', function () {
                        auth.codeInput.focus();
                    });

                    auth.phoneInput.on('keyup', auth.onPhoneInputChange)
                        .on('keypress', function (event) {
                            if (event.keyCode == 13) {
                                auth.sendCode();
                            }
                        });
                    auth.codeInput.on('keyup', auth.onCodeInputsChange)
                        .on('input', auth.onCodeInputsChange);

                    auth.sendBtn.addClass('disabled').on('click', auth.sendCode);
                    auth.resendBtn.addClass('disabled').on('click', auth.resendCode);
                    auth.wrongBtn.on('click', auth.wrongNumber);

                    if (auth.changePhone) {
                        auth.window.find('.window_title span').html('Смена телефона');
                        auth.window.find('.window_body .signin .message').html('ПИН-код для смены телефона будет '
                            + (auth.isCall ? 'передан в телефонном номере' : 'отправлен по&nbsp;СМС'));
                    }

                    auth.window.addClass('opened').animate({opacity: 1}, 100, function () {
                        auth.phoneInput.focus();
                        bodyFreeze(true);
                    });

                    auth.windowOpened = true;
                    trackEvent('AUTH_WINDOW_OPENED');
                },
                closeWindow: function () {

                    if (auth.sending) {
                        return;
                    }

                    auth.window.animate({opacity: 0}, 100, function () {
                        $(this).removeClass('opened');
                        auth.window.find('.signin').removeClass('d-none');
                        auth.window.find('.pincode').addClass('d-none');
                        auth.window.find('.window_title span').html('Вход на сайт');
                        auth.window.find('.window_body .signin .message').html('ПИН-код для входа на&nbsp;сайт будет '
                            + (auth.isCall ? 'передан в телефонном номере' : 'отправлен по&nbsp;СМС'));
                        auth.sendBtn.removeClass('disabled').off('click');
                        auth.resendBtn.removeClass('disabled').off('click');
                        auth.phoneInput.val('');
                        auth.codeInput.val('');
                        auth.codeDigits.html('');
                    });

                    auth.windowOpened = false;
                    auth.phoneInput.off('keyup').off('keypress');
                    auth.window.find('.pincode').off('click');
                    auth.codeInput.off('keyup').off('input');
                    auth.wrongBtn.off('click');
                    auth.codePanel.off('click');

                    body.off('click', auth.onBodyClick);
                    bodyFreeze(false);
                    bodyScroll(true);
                    $(window).scrollTop(auth.scrollTop);
                }
            };

            //Профиль
            var profile = {
                init: function () {
                    profile.sending = false;
                    profile.changes = {};

                    profile.name = $('#guest-name').on('keyup', profile.onFormChange);
                    profile.phone = $('#guest-phone').mask('+7 000 000-00-00')
                        .on('click', profile.changePhone);
                    profile.email = $('#guest-email').on('keyup', profile.onFormChange);

                    profile.bday = $('#guest-day').on('selectmenuselect', profile.onBDayChange);
                    profile.bmonth = $('#guest-month').on('selectmenuselect', profile.onBDayChange);
                    profile.bchange = $('#guest-bchange');

                    profile.isSubscribed = $('#guest-subs').on('click', function () {
                        var switcher = $(this).find('.switcher');
                        if (switcher.hasClass('checked')) {
                            switcher.removeClass('checked');
                        } else {
                            switcher.addClass('checked');
                        }
                        profile.onFormChange();
                    });

                    profile.bonus = $('#guest-bonus');
                    profile.saveBtn = $('#guest-save').on('click', profile.save);

                    profile.orders = $('.profile-orders');
                    profile.ordersList = profile.orders.find('.po_list');
                    profile.ordersLoad = profile.orders.find('.po_load');
                    profile.ordersMore = profile.ordersLoad.find('.btn');
                    profile.ordersMoreIcon = profile.ordersMore.find('.btn_icon');

                    profile.updateBonusBalance();
                    profile.loadOrders();
                },
                onBDayChange: function () {
                    profile.bchange.attr('data-changed', '1');
                    profile.bday.selectmenu("widget").addClass('ui-valid');
                    profile.bmonth.selectmenu("widget").addClass('ui-valid');
                    profile.onFormChange();
                },
                onFormChange: function () {
                    var isChanged = false,
                        subsSwitcher = profile.isSubscribed.find('.switcher'),
                        isSubscribed = subsSwitcher.hasClass('checked');

                    if (profile.name.val().length > 0
                        && profile.name.val() != profile.name.attr('data-last')) {
                        profile.changes.name = profile.name.val();
                        profile.name.addClass('valid');
                        isChanged = true;
                    } else if (typeof profile.changes.name !== "undefined") {
                        profile.name.removeClass('valid');
                        delete profile.changes.name;
                    }

                    if (pregPatterns.email.test(profile.email.val())
                        && profile.email.val() != profile.email.attr('data-last')) {
                        profile.changes.email = profile.email.val();
                        profile.email.addClass('valid');
                        isChanged = true;
                    } else if (typeof profile.changes.email !== "undefined") {
                        profile.email.removeClass('valid');
                        delete profile.changes.email;
                    }

                    if (profile.bchange.attr('data-changed') == '1') {
                        profile.changes.bday = profile.bmonth.val() + profile.bday.val();
                        isChanged = true;
                    } else if (typeof profile.changes.bday !== "undefined") {
                        delete profile.changes.bday;
                    }

                    if (+isSubscribed != parseInt(subsSwitcher.attr('data-last'))) {
                        profile.changes.is_subscribed = +isSubscribed;
                        isChanged = true;
                    } else if (typeof profile.changes.is_subscribed !== "undefined") {
                        delete profile.changes.is_subscribed;
                    }

                    if (isChanged) {
                        profile.saveBtn.removeClass('d-none');
                    } else {
                        profile.saveBtn.addClass('d-none');
                    }
                },
                save: function () {
                    profile.changes.xhr = getXhrHash();
                    $.ajax('/profile/save', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: profile.changes,
                        beforeSend: function () {
                            profile.sending = true;
                            profile.saveBtn.addClass('disabled')
                                .html('Сохраняю<div class="btn_icon load"></div>');
                        },
                        success: function (info) {

                            if (typeof profile.changes.name !== "undefined") {
                                profile.name.attr('data-last', profile.changes.name)
                                    .removeClass('valid');
                            }

                            if (typeof profile.changes.email !== "undefined") {
                                profile.email.attr('data-last', profile.changes.email)
                                    .removeClass('valid');
                            }

                            if (typeof profile.changes.bday !== "undefined") {
                                profile.bchange.html(info.bday);
                            }

                            if (typeof profile.changes.is_subscribed !== "undefined") {
                                profile.isSubscribed.find('.switcher')
                                    .attr('data-last', profile.changes.is_subscribed);
                            }

                            profile.saveBtn.addClass('d-none');
                            profile.changes = {};

                        },
                        error: function (xhr) {
                            if (typeof xhr['responseJSON'] !== "undefined" && xhr.status == 400) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка сохранения. Попробуйте позже',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }

                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                        complete: function () {
                            profile.sending = false;
                            profile.saveBtn.removeClass('disabled')
                                .html('Сохранить');
                        }
                    });
                },
                changePhone: function () {
                    auth.changePhone = true;
                    auth.initiator = profile.phone;
                    auth.openWindow(function () {
                        profile.phone.val(auth.phoneInput.val());
                        profile.updateBonusBalance();
                        auth.changePhone = false;
                    });
                },
                updateBonusBalance: function () {
                    $.ajax('/profile/bonus/balance', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            profile.bonus.html(data !== null ? Math.trunc(data) : '&mdash;');
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        }
                    });
                },
                loadOrders: function () {
                    $.ajax('/profile/orders', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            limit: 4,
                            page: profile.orders.attr('data-page'),
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            profile.ordersMore.addClass('disabled');
                            profile.ordersMoreIcon.removeClass('downarr').addClass('load');
                        },
                        success: function (data) {

                            var html = '',
                                isMore = false;

                            profile.ordersLoad.addClass('d-none');
                            if (data.length === 0) {
                                return false;
                            }

                            $.each(data, function (key, order) {

                                if (typeof order.more !== "undefined") {
                                    isMore = true;
                                    return;
                                }

                                html += '<div class="po_item">';

                                html += '<div class="po_line">';
                                html += '<div class="po_order c-pointer" data-link="/cart/success?id=' + order.guid + '"><span>Заказ </span>#' + order.id + '</div>';
                                html += '<div class="co_type clock">' + order.created_local + '</div>';
                                html += '</div>';

                                html += '<div class="po_line">';
                                html += '<div class="po_name">Статус заказа:</div>';
                                html += '<div class="order-status os_' + order.status + '">' + order.status_name + '</div>';
                                html += '</div>';

                                html += '<div class="po_line">';
                                html += '<div class="po_name">Сумма к оплате:</div>';
                                html += '<div>' + order.pay_sum + '</div>';
                                html += '</div>';

                                html += '<div class="po_line line"></div>';

                                $.each(order.products, function (kp, product) {

                                    html += '<div class="po_line dish">';
                                    html += '<div>' + product.name + '</div>';
                                    html += '<div class="wrapper"></div>';
                                    html += '<div class="po_count">' + product.amount + ' шт.</div>';
                                    html += '<div class="po_price">' + product.pay_sum + '</div>';
                                    html += '</div>';

                                });

                                html += '<div class="wrapper"></div>';

                                html += '<div class="po_line submit noselect"><div class="btn btn-white btn-sm" data-id="' + order.id + '">Повторить</div></div>';

                                html += '</div>';

                            });

                            if (profile.orders.attr('data-page') == '1') {
                                profile.ordersList.html(html);
                            } else {
                                profile.ordersList.append(html);
                            }

                            profile.orders.removeClass('d-none');

                            profile.ordersList.find('*[data-link]').on('click', function () {
                                if ($(this).hasClass('selected') || $(this).hasClass('disabled')
                                    || $(this).hasClass('empty')) {
                                    return false;
                                }
                                window.location = $(this).attr('data-link');
                            });

                            profile.ordersList.find('.submit .btn')
                                .on('click', profile.repeatOrder);

                            if (isMore) {
                                profile.ordersLoad.removeClass('d-none');
                                profile.ordersLoad.find('.btn').on('click', function () {
                                    profile.orders.attr('data-page',
                                        parseInt(profile.orders.attr('data-page')) + 1);
                                    profile.loadOrders();
                                    return false;
                                });
                            }

                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                        complete: function (xhr) {
                            profile.ordersMore.removeClass('disabled');
                            profile.ordersMoreIcon.addClass('downarr').removeClass('load');
                        }
                    });
                },
                repeatOrder: function () {
                    var button = $(this),
                        orderId = button.attr('data-id');

                    if (button.hasClass('disabled')) {
                        return false;
                    }

                    $.ajax('/cart/add/order', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            order_id: orderId,
                            return_cart: 1,
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            cart.loading = true;
                            button.addClass('disabled');
                        },
                        success: function (data) {
                            if (typeof data === "undefined") {
                                return false;
                            }

                            trackEvent('CART_ADD');
                            cart.showNotification('Добавлено', 'Заказ № ' + orderId);

                            cart.firstLoaded = true;
                            cart.data = data;
                            cart.redrawPanel();
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            Swal.fire({
                                type: 'error',
                                title: 'Ошибка',
                                text: 'Произошла ошибка во время добавления в корзину. Попробуйте еще раз',
                                confirmButtonClass: 'btn btn-color',
                                buttonsStyling: false
                            });
                        },
                        complete: function () {
                            cart.loading = false;
                            button.removeClass('disabled');
                        }
                    });
                }
            };

            //Блюдо
            var Dish = function (id, name, price, bzu) {

                if (typeof id === "undefined") {
                    id = '';
                }

                if (typeof name === "undefined") {
                    name = '';
                }

                if (typeof price === "undefined") {
                    price = 0;
                }

                if (typeof bzu === "undefined") {
                    bzu = {
                        fiber: 0,
                        fat: 0,
                        carbohydrate: 0,
                        energy: 0,
                        weight: 0
                    };
                }

                this.id = id;
                this.name = name;
                this.price = price;
                this.bzu = bzu;
                this.relation = null;
                this.selectors = {};
                this.modifiers = {};
                this.modsLeft = {};
                this.total = price;

                this.fromDish = function (dish) {
                    this.id = dish.id;
                    this.name = dish.name;
                    this.price = dish.price;
                    this.bzu = jsonCopy(dish.bzu);
                    this.relation = jsonCopy(dish.relation);
                    this.selectors = jsonCopy(dish.selectors);
                    this.modifiers = jsonCopy(dish.modifiers);
                    this.modsLeft = jsonCopy(dish.modsLeft);
                    this.total = dish.total;
                };

                this.recount = function () {
                    this.total = this.price;

                    for (var i in this.selectors) {
                        this.total += this.selectors[i].price_raw;
                    }

                    for (var i in this.modifiers) {
                        this.total += this.modifiers[i].price_raw;
                    }
                };

                this.getBzu = function () {
                    var bzu = jsonCopy(this.bzu);

                    for (var i in this.selectors) {
                        bzu.fiber += this.selectors[i].fiber_raw;
                        bzu.fat += this.selectors[i].fat_raw;
                        bzu.carbohydrate += this.selectors[i].carbohydrate_raw;
                        bzu.energy += this.selectors[i].energy_raw;
                        bzu.weight += this.selectors[i].weight_raw;
                    }

                    for (var i in this.modifiers) {
                        bzu.fiber += this.modifiers[i].fiber_raw;
                        bzu.fat += this.modifiers[i].fat_raw;
                        bzu.carbohydrate += this.modifiers[i].carbohydrate_raw;
                        bzu.energy += this.modifiers[i].energy_raw;
                        bzu.weight += this.modifiers[i].weight_raw;
                    }

                    return bzu;
                };

                this.setRelation = function (relation) {
                    if (typeof relation !== "object") {
                        return false;
                    }

                    this.id = relation.product_id;
                    this.price = relation.price_raw;
                    this.bzu.fiber = relation.fiber_raw;
                    this.bzu.fat = relation.fat_raw;
                    this.bzu.carbohydrate = relation.carbohydrate_raw;
                    this.bzu.energy = relation.energy_raw;
                    this.bzu.weight = relation.weight_raw;
                    this.relation = relation;

                    this.recount();
                };

                this.setSelector = function (selector, groupId) {
                    if (typeof selector !== "object" || typeof groupId !== "string") {
                        return false;
                    }

                    selector.group_id = groupId;
                    this.selectors[groupId] = selector;
                    this.recount();
                };

                this.addModifier = function (modifier, groupId, max) {
                    if (typeof modifier !== "object"
                        || typeof groupId !== "string"
                        || typeof max === "undefined") {
                        return false;
                    }

                    max = parseInt(max);

                    if (max > 0) {
                        if (typeof this.modsLeft[groupId] !== "undefined") {
                            if (this.modsLeft[groupId] > 0) {
                                this.modsLeft[groupId]--;
                            }
                        } else {
                            this.modsLeft[groupId] = max - 1;
                        }
                    }

                    modifier.group_id = groupId;
                    this.modifiers[modifier.product_id] = modifier;
                    this.recount();

                    if (max > 0 && this.modsLeft[groupId] <= 0) {
                        return groupId;
                    }
                };

                this.removeModifier = function (productId, groupId) {
                    if (typeof productId !== "string") {
                        return false;
                    }

                    if (typeof groupId === "string"
                        && typeof this.modsLeft[groupId] !== "undefined") {
                        this.modsLeft[groupId]++;
                    }

                    delete this.modifiers[productId];
                    this.recount();
                };

                this.getTotalWithCurrency = function () {
                    return numberFormat(
                        this.total,
                        _config.currencyDecimals,
                        _config.decimalSeparator,
                        _config.thousandSeparator
                    ) + ' ' + _config.currencySymbol;
                };

                this.clear = function () {
                    this.id = '';
                    this.name = '';
                    this.price = 0;
                    this.bzu = {
                        fiber: 0,
                        fat: 0,
                        carbohydrate: 0,
                        energy: 0,
                        weight: 0
                    };
                    this.relation = null;
                    this.selectors = {};
                    this.modifiers = {};
                    this.modsLeft = {};
                    this.total = 0;
                };
            };

            //Продукты
            var products = {
                init: function () {
                    products.product = $('.product');
                    products.items = $('.products .products_item');
                    products.isCart = $('.cart_container .cart_page').length > 0;

                    products.modWindowOpened = false;
                    products.isProductWindow = false;
                    products.isProductPage = (products.product.length > 0 ? true
                        : (products.items.length > 0 ? false : null));
                    if (products.isProductPage === null) {
                        return false;
                    }

                    if (products.isProductPage) {
                        products.initProduct();
                    } else {
                        products.items.find('a').on('click', products.openProductWindow);
                        products.items.find('.foot.simple .cart-btn:not(.disabled)').on('click', products.addToCart);
                        products.items.find('.foot.diff .cart-btn:not(.disabled)').on('click', products.openProductWindow);
                    }
                },
                uninit: function () {
                    products.product = null;
                    products.isCart = false;
                    products.isProductPage = false;

                    try {
                        products.items.find('a').off('click');
                        products.items.find('.foot.simple .cart-btn:not(.disabled)').off('click');
                        products.items.find('.foot.diff .cart-btn:not(.disabled)').off('click');
                    } catch (e) {
                        console.log(e);
                    }

                    products.items = null;
                },
                initProduct: function (window) {
                    if (typeof window !== "undefined") {
                        products.isProductWindow = true;
                        products.product = window.find('.product');
                    }

                    products.isProductPage = true;
                    products.product.image = products.product.find('.product_image > img');
                    products.product.desc = products.product.find('.pp_desc');
                    products.product.bzu = products.product.find('.pp_nutrition');
                    products.product.weight = products.product.find('.pp_total > .ppt_weight');
                    products.product.total = products.product.find('.pp_total > .ppt_sum');

                    products.cartButton = products.product.find('.btn-color').on('click', products.addToCart);

                    products.relations = products.product.find('.relations .ss_item')
                        .on('click', products.relationChange);
                    products.selectors = products.product.find('.selectors .ss_item')
                        .on('click', products.selectorChange);

                    products.modViewer = products.product.find('.pp_mods');
                    products.modOpenBtn = products.modViewer.find('.ppm_add')
                        .on('click', products.openModWindow);

                    products.modInfo = $('#mods-info');
                    products.modWindow = $('#mods-window');
                    products.modWindow.find('.close-cross').on('click', function () {
                        products.closeModWindow();
                    });

                    products.dish = new Dish(
                        products.product.attr('data-id'),
                        products.product.attr('data-name'),
                        parseFloat(products.product.attr('data-price')),
                        JSON.parse(products.product.attr('data-bzu'))
                    );

                    if (products.relations.length > 0) {
                        products.relations.removeClass('selected').each(function () {
                            if (!$(this).hasClass('disabled')) {
                                $(this).trigger('click');
                                return false;
                            }
                        });

                    }

                    if (products.selectors.length > 0) {
                        products.product.find('.selectors').each(function () {
                            $(this).find('.ss_item').removeClass('selected').each(function () {
                                if (!$(this).hasClass('disabled')) {
                                    $(this).trigger('click');
                                    return false;
                                }
                            });
                        });
                    }

                    var totalText = products.product.total.text(),
                        isTotalSep = totalText.indexOf(',') !== -1,
                        totalEx = totalText.split(' '),
                        currency = totalEx[totalEx.length - 1];

                    _config.currencyDecimals = isTotalSep ? 2 : 0;
                    _config.currencySymbol = currency;

                    products.redrawView();
                },
                uninitProduct: function () {
                    products.isProductWindow = false;
                    products.isProductPage = false;
                    products.cartButton.off('click');
                    products.relations.off('click');
                    products.selectors.off('click');
                },
                selectorPositioning: function (item) {
                    if (typeof item === "undefined") {
                        return false;
                    }

                    var wrapper = item.parent(),
                        wrapperWidth = wrapper.width(),
                        itemPosition = item.position(),
                        itemWidth = item.outerWidth(true),
                        itemOffset = itemPosition.left + itemWidth,
                        itemLeft = 0;

                    if (itemPosition.left < 0 || itemOffset > wrapperWidth) {
                        wrapper.find('.ss_item').each(function () {
                            if ($(this).hasClass('selected')) {
                                return false;
                            }
                            itemLeft += $(this).outerWidth(true);
                        });
                        wrapper.animate({scrollLeft: itemLeft - ((wrapperWidth / 2) - (itemWidth / 2))}, 100);
                    }
                },
                relationChange: function () {
                    if ($(this).hasClass('selected') || $(this).hasClass('disabled')) {
                        return false;
                    }

                    products.relations.removeClass('selected');
                    $(this).addClass('selected');
                    products.selectorPositioning($(this));

                    var data = JSON.parse($(this).attr('data-info')),
                        image = data.image_path.length > 0 ? uploadsCdn + data.image_path : _config.imagePlug;

                    products.dish.setRelation(data);

                    products.product.image.attr('src', image);
                    products.product.desc.html(data.description);

                    if (products.cartButton.hasClass('disabled')) {
                        products.cartButton.removeClass('disabled').html('В корзину<div class="btn_icon cart"></div>');
                    }

                    products.redrawView();

                },
                selectorChange: function () {
                    if ($(this).hasClass('selected') || $(this).hasClass('disabled')) {
                        return false;
                    }

                    $(this).parent().find('.ss_item').removeClass('selected');
                    $(this).addClass('selected');
                    products.selectorPositioning($(this));

                    products.dish.setSelector(
                        JSON.parse($(this).attr('data-info')),
                        $(this).closest('.switch-selector').attr('data-group')
                    );
                    products.redrawView();
                },
                modifierChange: function () {
                    if ($(this).hasClass('disabled')) {
                        return false;
                    }

                    var data = JSON.parse($(this).attr('data-info')),
                        item = $(this).closest('.mwm_mod'),
                        groupId = item.attr('data-group'),
                        max = item.attr('data-max');

                    if ($(this).hasClass('checked')) {
                        $(this).removeClass('checked');
                        products.dishBuffer.removeModifier(data.product_id, groupId);
                        products.modWindow.find('.mwm_mod[data-group=' + groupId + '] .plus-btn:not(.checked):not(.md)').attr('title', '')
                            .removeClass('disabled');
                    } else {
                        $(this).addClass('checked');
                        if (typeof products.dishBuffer.addModifier(data, groupId, max) === "string") {
                            products.modWindow.find('.mwm_mod[data-group=' + groupId + '] .plus-btn:not(.checked):not(.md)').attr('title', 'Максимум ' + max).addClass('disabled');
                        }
                    }

                    products.modWindow.find('.mwt_sum > span').html(products.dishBuffer.getTotalWithCurrency());
                },
                applyModifiers: function () {
                    products.dish.fromDish(products.dishBuffer);
                    products.modInfo.html(products.modWindow.find('.window_body').html());

                    products.modViewer.find('.ppm_mod .close').off('click').each(function () {
                        $(this).parent().remove();
                    });

                    if (Object.keys(products.dish.modifiers).length > 0) {
                        var block = '';
                        for (var modId in products.dish.modifiers) {
                            var mod = products.dish.modifiers[modId];
                            block += '<div class="ppm_mod" data-id="' + modId + '" data-group="' + mod.group_id + '">' + mod.name + '<div class="close"></div></div>'
                        }

                        products.modViewer.prepend(block);
                        products.modViewer.find('.ppm_mod .close').on('click', products.deleteModifier);
                    }

                    products.redrawView();
                    products.closeModWindow();
                },
                slideModifiers: function () {
                    var scrollDirection = $(this).hasClass('next') ? 1 : -1,
                        list = $(this).closest('.mwm_block').find('.mwm_list');

                    list.animate({scrollLeft: list.scrollLeft() + (130 * scrollDirection)}, 100);
                },
                deleteModifier: function () {
                    var mod = $(this).parent(),
                        modId = mod.attr('data-id'),
                        modGroup = mod.attr('data-group');

                    products.modInfo.find('.mwm_mod[data-id=' + modId + '] .plus-btn.checked')
                        .removeClass('checked');
                    products.modInfo.find('.mwm_mod[data-group=' + modGroup + '] .plus-btn:not(.checked):not(.md)').attr('title', '')
                        .removeClass('disabled');
                    products.dish.removeModifier(modId, modGroup);
                    products.redrawView();
                    mod.remove();
                },
                redrawView: function () {
                    var countedBzu = products.dish.getBzu(),
                        bzuText = [
                            numberFormat(countedBzu.energy, 2, _config.decimalSeparator, _config.thousandSeparator),
                            numberFormat(countedBzu.fat, 2, _config.decimalSeparator, _config.thousandSeparator),
                            numberFormat(countedBzu.fiber, 2, _config.decimalSeparator, _config.thousandSeparator),
                            numberFormat(countedBzu.carbohydrate, 2, _config.decimalSeparator, _config.thousandSeparator)
                        ],
                        weight = numberFormat(countedBzu.weight, 0, _config.decimalSeparator, _config.thousandSeparator) + ' г';


                    products.product.bzu.find('.nut').each(function (index) {
                        $(this).find('span').html(bzuText[index]);
                    });
                    products.product.weight.find('span').html(weight);
                    products.product.total.html(products.dish.getTotalWithCurrency());
                },
                addToCart: function () {
                    var btn = $(this),
                        item = btn.closest('.products_item'),
                        productId = item.attr('data-id'),
                        name = item.attr('data-name'),
                        price = item.attr('data-price');

                    if (btn.hasClass('disabled')) {
                        return false;
                    }

                    if (!products.isProductPage) {
                        products.dish = new Dish(
                            productId,
                            name,
                            parseFloat(price)
                        );
                    }

                    btn.addClass('disabled');
                    cart.addDish(products.dish, products.dish.name, function () {
                        btn.removeClass('disabled');
                        if (products.isCart && typeof cart.suggestAdded === "function") {
                            cart.suggestAdded(products.dish);
                        }
                    });
                },
                openProductWindow: function (event) {
                    event.preventDefault();
                    products.isProductWindow = true;
                    cart.scrollTop = $(window).scrollTop();

                    var title = $(document).prop('title'),
                        item = $(this).closest('.products_item'),
                        path = item.find('a').attr('href');

                    products.loadContent = $('<div class="load-content"><div class="load-content_outer"><div class="load-content__container"><div class="load-content__close"></div><div class="load-content__inner"></div></div></div></div>').appendTo(body);
                    products.loadContainer = products.loadContent.find('.load-content__inner');

                    $.ajax('/__ajax_product__' + path, {
                        cache: false,
                        dataType: 'html',
                        type: 'POST',
                        data: {
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            if (typeof data !== "string") {
                                window.location = path;
                                return false;
                            }

                            products.loadContainer.html(data);

                            products.loadContent.find('.load-content__close').on('click', function (event) {
                                event.preventDefault();
                                if (products.isCart) {
                                    products.closeProductWindow();
                                } else {
                                    window.history.back();
                                }
                            });

                            $('.header_logo, .footer_logo, .nav_menu_item.selected, .hm_item.selected').on('click', function (event) {
                                event.preventDefault();
                                if (products.isCart) {
                                    products.closeProductWindow();
                                } else {
                                    window.history.back();
                                }
                            }).addClass('c-pointer');

                            if (!products.isCart) {
                                $(document).prop('title', item.attr('data-name'));
                                window.history.pushState(null, null, path);
                                pageView(document.location.pathname);
                                window.onpopstate = function (event) {
                                    if (products.windowOpened) {
                                        $(document).prop('title', title);
                                        products.closeProductWindow();
                                        pageView(document.location.pathname);
                                    }
                                };
                            } else {
                                products.loadContent.addClass('cart');
                            }

                            products.initProduct(products.loadContainer);
                            products.loadContent.addClass('loaded');
                            bodyScroll(false);
                            bodyFreeze(true);
                            products.windowOpened = true;
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            window.location = path;
                        },
                    });
                },
                closeProductWindow: function () {
                    products.uninitProduct();
                    products.loadContent.removeClass('loaded');
                    products.windowOpened = false;
                    products.isProductWindow = false;
                    $('.header_logo, .footer_logo, .nav_menu_item.selected, .hm_item.selected').off('click')
                        .removeClass('c-pointer');
                    bodyFreeze(false);
                    bodyScroll(true);
                    $(window).scrollTop(cart.scrollTop);
                    setTimeout(function () {
                        products.loadContent.remove();
                    }, 250);
                },
                onBodyClick: function (event) {
                    var panel = products.modWindow.find('.window_panel'),
                        swalc = $('.swal2-container');

                    if (products.modWindowOpened) {
                        if (products.firstEvent
                            && !swalc.is(event.target)
                            && swalc.has(event.target).length === 0
                            && !panel.is(event.target)
                            && panel.has(event.target).length === 0) {
                            products.closeModWindow();
                        }
                    }

                    products.firstEvent = true;
                },
                openModWindow: function () {
                    products.firstEvent = false;
                    body.on('click', products.onBodyClick);

                    if (!products.isProductWindow) {
                        products.scrollTop = $(window).scrollTop();
                        bodyScroll(false);
                    }

                    products.dishBuffer = new Dish();
                    products.dishBuffer.fromDish(products.dish);

                    products.modWindow.find('.window_body').html(products.modInfo.html());
                    products.modWindow.find('.mwt_sum > span').html(products.dishBuffer.getTotalWithCurrency());

                    products.modWindow.find('.mwm_slider .slide').on('click', products.slideModifiers);
                    products.modifiers = products.modWindow.find('.mwm_mod .plus-btn')
                        .on('click', products.modifierChange);
                    products.modWindow.find('.mw_total .btn-color')
                        .on('click', products.applyModifiers);

                    products.modWindow.addClass('opened').animate({opacity: 1}, 100, function () {
                        bodyFreeze(true);
                    });
                    products.modWindowOpened = true;
                },
                closeModWindow: function () {
                    products.modWindow.animate({opacity: 0}, 100, function () {
                        $(this).removeClass('opened');
                    });

                    products.modWindowOpened = false;
                    products.modWindow.find('.mwm_mod').off('click');
                    products.modWindow.find('.mw_total .btn-color').off('click');
                    body.off('click', products.onBodyClick);
                    products.dishBuffer = null;

                    if (!products.isProductWindow) {
                        bodyFreeze(false);
                        bodyScroll(true);
                        $(window).scrollTop(products.scrollTop);
                    }
                }
            };

            //Корзина
            var cart = {
                init: function () {
                    cart.loading = false;
                    cart.data = null;
                    cart.notificationOpened = false;
                    cart.popupOpened = false;
                    cart.loaderOpened = false;
                    cart.firstLoaded = false;

                    cart.waitPopup = false;
                    cart.loader = $('#cart-loader');
                    cart.page = $('.cart_container .cart_page');
                    cart.popup = $('#cart-popup')
                        .on('mouseenter', cart.openPopup)
                        .on('mouseleave', cart.closePopup);

                    cart.isCartPage = (cart.page.length > 0 ? true
                        : (cart.popup.length > 0 ? false : null));

                    if (cart.isCartPage === null) {
                        return false;
                    }

                    cart.notification = $('#cart-notification');
                    cart.loadParams = {};

                    if (cart.isCartPage) {
                        cart.loadParams.with_coupon = 1;
                        cart.loadParams.check_order_available = 1;

                        cart.cartBlock = cart.page;
                        cart.sumBlock = $('.cart_sidebar .sp_block:first-child');
                        cart.personsSelector = $('.cart_sidebar .sp_persons .count-selector');

                        cart.couponInput = $('.cart_sidebar .sp_promo input');
                        cart.couponCheck = $('.cart_sidebar .sp_promo .btn');

                        cart.submitBtn = $('.cart_sidebar .sp_submit');
                        cart.notWorkingBlock = $('.cart_sidebar .cart-notice');

                        cart.redrawPage();
                    } else {
                        cart.popupBtn = $('.header_container .cart-btn')
                            .on('mouseenter', cart.openPopup)
                            .on('mouseleave', cart.closePopup);

                        cart.load();
                    }

                },
                load: function (drawDone) {
                    if (cart.loading) {
                        return false;
                    }

                    cart.loadParams.xhr = getXhrHash();
                    $.ajax('/cart/get', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: cart.loadParams,
                        beforeSend: function () {
                            cart.loading = true;
                        },
                        success: function (data) {
                            if (typeof data === "undefined") {
                                return false;
                            }
                            cart.firstLoaded = true;
                            cart.data = data;
                            if (cart.isCartPage) {
                                cart.redrawPage(drawDone);
                            } else {
                                cart.redrawPanel(drawDone);
                            }
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                        complete: function () {
                            cart.loading = false;
                        }
                    });
                },
                redrawPanel: function (done) {
                    var isEmpty = cart.data === null,
                        productsBlock = cart.popup.find('.cp_products'),
                        imageContain = cart.popup.attr('data-image') == 'contain',
                        html = '';

                    productsBlock.find('.count-selector .minus').off('click');
                    productsBlock.find('.count-selector .plus').off('click');
                    productsBlock.find('.delete-cross').off('click');

                    if (isEmpty && cart.popupOpened) {
                        cart.closePopup();
                    }

                    cart.popupBtn.find('.sum').html(isEmpty ? '' : cart.data.pay_sum);
                    cart.popupBtn.find('.count').html(isEmpty ? '' : cart.data.count);

                    cart.popup.find('.cpp_total .sum').html(isEmpty ? '' : cart.data.pay_sum);

                    if (isEmpty) {
                        cart.popupBtn.addClass('empty');
                    } else {
                        cart.popupBtn.removeClass('empty');
                    }

                    if (isEmpty) {
                        if (typeof done === "function") {
                            done();
                        }
                        return false;
                    }

                    for (var ik in cart.data.list) {
                        var item = cart.data.list[ik],
                            image = item.image_path.length > 0 ? uploadsCdn + item.image_path : _config.imagePlug,
                            contain = item.image_path.length > 0 ? imageContain : true,
                            dops = [];

                        if (item.relation_name.length > 0) {
                            dops.push(item.relation_name);
                        }

                        if (typeof item.selectors === "object") {
                            for (var sk in item.selectors) {
                                dops.push(item.selectors[sk].name);
                            }
                        }

                        if (typeof item.extra_added === "object" && item.extra_added.length > 0) {
                            dops.push(declension(item.extra_added.length, ['доп', 'допа', 'допов']));
                        }

                        html += '<div class="cpp_item" data-hash="' + item.combo_hash + '" data-amount="' + item.amount + '">';
                        html += '<div class="delete-cross"></div>';
                        html += '<img src="' + image + '" class="image' + (contain ? ' contain' : '') + '">';

                        html += '<div class="cpp_info">';
                        html += '<div class="name">' + item.name + '</div>';
                        html += '<div class="dop">' + dops.join(', ') + '</div>';

                        html += '<div class="cpp_action">';

                        html += '<div class="count-selector noselect">';
                        html += '<div class="minus' + (item.amount < 2 ? ' disabled' : '') + '"></div>';
                        html += '<div class="count">' + item.amount + '</div>';
                        html += '<div class="plus' + (item.amount > 98 ? ' disabled' : '') + '"></div>';
                        html += '</div>';

                        html += '<div class="sum">' + item.pay_sum + '</div>';
                        html += '</div>';

                        html += '</div>';

                        html += '</div>';
                    }

                    productsBlock.html(html);
                    productsBlock.find('.count-selector .minus').on('click', cart.selectorAmount);
                    productsBlock.find('.count-selector .plus').on('click', cart.selectorAmount);
                    productsBlock.find('.delete-cross').on('click', cart.removeItem);

                    if (cart.data.list.length > 3) {
                        productsBlock.css({height: 330}).addClass('scroll-vert');
                    } else {
                        productsBlock.css({height: 'auto'}).removeClass('scroll-vert');
                    }

                    if (typeof done === "function") {
                        done();
                    }

                },
                selectorAmount: function () {
                    if ($(this).hasClass('disabled')) {
                        return false;
                    }

                    var item = $(this).closest('.cl_item, .cpp_item'),
                        hash = item.attr('data-hash'),
                        amount = parseInt(item.attr('data-amount'));

                    if ($(this).hasClass('minus')) {
                        amount--;
                    } else {
                        amount++;
                    }

                    $(this).addClass('disabled');
                    cart.changeAmount(hash, amount);
                },
                removeItem: function () {
                    $(this).addClass('disabled');
                    cart.changeAmount($(this).closest('.cl_item, .cpp_item').attr('data-hash'), 0);
                },
                redrawPage: function (done) {
                    var isEmpty = cart.data === null,
                        imageContain = cart.cartBlock.attr('data-image') == 'contain',
                        html = '';

                    if (cart.firstLoaded) {
                        if (isEmpty) {
                            window.location = '/';
                            return false;
                        }

                        var isOrderOff = cart.data.order_off !== null,
                            isBanned = false;

                        cart.cartBlock.find('.count-selector .minus').off('click');
                        cart.cartBlock.find('.count-selector .plus').off('click');
                        cart.cartBlock.find('.delete-cross').off('click');
                        cart.personsSelector.find('.minus').off('click');
                        cart.personsSelector.find('.plus').off('click');
                        cart.couponInput.off('keypress');
                        cart.couponCheck.off('click');
                        cart.submitBtn.off('click');

                        for (var ik in cart.data.list) {
                            var item = cart.data.list[ik],
                                image = item.image_path.length > 0 ? uploadsCdn + item.image_path : _config.imagePlug,
                                contain = item.image_path.length > 0 ? imageContain : true,
                                dops = [],
                                selectors = [],
                                modifiers = [];

                            if (item.relation_name.length > 0) {
                                selectors.push(item.relation_name);
                            }

                            if (typeof item.selectors === "object") {
                                for (var sk in item.selectors) {
                                    selectors.push(item.selectors[sk].name);
                                }
                            }

                            if (typeof item.extra_added === "object") {
                                for (var sk in item.extra_added) {
                                    modifiers.push(item.extra_added[sk].name);
                                }
                            }

                            if (selectors.length > 0) {
                                dops.push(selectors.join(', '));
                            }

                            if (modifiers.length > 0) {
                                dops.push('Добавлено: ' + modifiers.join(', '));
                            }

                            if (selectors.length == 0 && modifiers.length == 0) {
                                dops.push(item.description);
                            }

                            html += '<div class="cl_item' + (item.is_banned ? ' disabled' : '') + '" title="' + item.ban_reason + '" data-hash="' + item.combo_hash + '" data-amount="' + item.amount + '">';

                            if (item.is_banned) {
                                isBanned = true;
                            }

                            html += '<img src="' + image + '" class="image' + (contain ? ' contain' : '') + '">';

                            html += '<div class="cl_info">';
                            html += '<div class="name">' + item.name + '</div>';
                            html += '<div class="dop">' + dops.join('<br>') + '</div>';
                            html += '</div>';

                            html += '<div class="wrapper"></div>';

                            html += '<div class="cl_action">';

                            html += '<div class="count-selector noselect">';
                            html += '<div class="minus"></div>';
                            html += '<div class="count">' + item.amount + '</div>';
                            html += '<div class="plus' + (item.amount > 98 ? ' disabled' : '') + '"></div>';
                            html += '</div>';

                            html += '<div class="sum">' + item.pay_sum + '</div>';
                            html += '</div>';

                            html += '<div class="delete-cross noselect"></div>';

                            html += '</div>';
                        }

                        cart.cartBlock.html(html);
                        cart.sumBlock.find('.total .spp_sum').html(cart.data.sum);
                        cart.sumBlock.find('.discount .spp_sum').html(cart.data.discount);
                        cart.sumBlock.find('.pay .spp_sum').html(cart.data.pay_sum);

                        if (cart.data.discount_raw > 0) {
                            cart.sumBlock.find('.total').removeClass('d-none');
                            cart.sumBlock.find('.discount').removeClass('d-none');
                        } else {
                            cart.sumBlock.find('.total').addClass('d-none');
                            cart.sumBlock.find('.discount').addClass('d-none');
                        }

                        if (cart.data.coupon !== null) {
                            cart.couponInput.val(cart.data.coupon.code).prop('readonly', true);
                            cart.couponCheck.addClass('cancel').html('Отменить');
                        } else {
                            cart.couponInput.val('').prop('readonly', false);
                            cart.couponCheck.removeClass('cancel').html('Применить');
                        }

                        if (isOrderOff) {
                            cart.notWorkingBlock.addClass('cn_clock');
                        } else {
                            cart.notWorkingBlock.removeClass('cn_clock');
                        }

                        if (isBanned || isOrderOff) {
                            cart.notWorkingBlock.removeClass('d-none').html(isOrderOff ? cart.data.order_off : 'Некоторые блюда, в&nbsp;данный момент, недоступны к&nbsp;заказу. Для оформления заказа необходимо удалить их&nbsp;из&nbsp;корзины');
                            cart.submitBtn.addClass('disabled');
                        } else {
                            cart.notWorkingBlock.addClass('d-none').html('');
                            cart.submitBtn.removeClass('disabled');
                        }

                    }

                    cart.cartBlock.find('.count-selector .minus').on('click', cart.selectorAmount);
                    cart.cartBlock.find('.count-selector .plus').on('click', cart.selectorAmount);
                    cart.cartBlock.find('.delete-cross').on('click', cart.removeItem);
                    cart.personsSelector.find('.minus').on('click', cart.selectorPersons);
                    cart.personsSelector.find('.plus').on('click', cart.selectorPersons);
                    cart.couponInput.on('keypress', function (event) {
                        if (event.keyCode == 13 && !$(this).prop('readonly')) {
                            cart.changeCoupon();
                        }
                    });
                    cart.couponCheck.on('click', cart.changeCoupon);
                    cart.submitBtn.on('click', cart.onSubmitClick);

                    cart.loadSuggest();

                    if (typeof done === "function") {
                        done();
                    }
                },
                selectorPersons: function () {
                    if ($(this).hasClass('disabled')) {
                        return false;
                    }

                    var place = cart.personsSelector.find('.count'),
                        max = parseInt(cart.personsSelector.attr('data-max')),
                        amount = parseInt(place.text());

                    if ($(this).hasClass('minus')) {
                        amount--;
                    } else {
                        amount++;
                    }

                    if (amount < 2) {
                        cart.personsSelector.find('.minus').addClass('disabled');
                    } else {
                        cart.personsSelector.find('.minus').removeClass('disabled');
                    }

                    if (amount >= max) {
                        cart.personsSelector.find('.plus').addClass('disabled');
                    } else {
                        cart.personsSelector.find('.plus').removeClass('disabled');
                    }

                    cart.changePersons(amount);
                    place.text(amount);
                },
                changeCoupon: function (done) {
                    var code = cart.couponInput.val(),
                        remove = cart.couponCheck.hasClass('cancel'),
                        path = !remove ? '/cart/coupon/set' : '/cart/coupon/remove',
                        isSilent = typeof done === "function",
                        batch = {
                            code: code,
                            return_cart: 1
                        };

                    if (code.length == 0 || cart.loading) {
                        return false;
                    }

                    for (var key in cart.loadParams) {
                        batch[key] = cart.loadParams[key];
                    }

                    batch['xhr'] = getXhrHash();
                    $.ajax(path, {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: batch,
                        beforeSend: function () {
                            cart.loading = true;
                            cart.couponInput.prop('disabled', true);
                            cart.couponCheck.addClass('disabled');
                        },
                        success: function (data) {
                            if (typeof data === "undefined") {
                                return false;
                            }

                            cart.firstLoaded = true;
                            cart.data = data;
                            cart.redrawPage();
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (!isSilent) {
                                if (typeof xhr['responseJSON'] !== "undefined"
                                    && (xhr.status == 403 || xhr.status == 404)) {
                                    Swal.fire({
                                        type: 'warning',
                                        text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                        confirmButtonClass: 'btn btn-color',
                                        buttonsStyling: false
                                    });
                                } else {
                                    Swal.fire({
                                        type: 'error',
                                        title: 'Ошибка',
                                        text: 'Произошла ошибка во время применения промокода. Попробуйте еще раз',
                                        confirmButtonClass: 'btn btn-color',
                                        buttonsStyling: false
                                    });
                                }
                            }
                        },
                        complete: function () {
                            cart.loading = false;
                            cart.couponInput.prop('disabled', false);
                            cart.couponCheck.removeClass('disabled');
                            if (isSilent) {
                                done();
                            }
                        }
                    });
                },
                createOrder: function () {
                    $.ajax('/cart/order/create', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            xhr: getXhrHash()
                        },
                        beforeSend: function () {
                            cart.submitBtn.addClass('disabled');
                        },
                        success: function () {
                            window.location = '/cart/address';
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (typeof xhr['responseJSON'] !== "undefined"
                                && (xhr.status == 403)) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                }).then(function () {
                                    cart.load();
                                });
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка во время оформления заказа',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                        },
                        complete: function () {
                            cart.submitBtn.removeClass('disabled');
                        }
                    });
                },
                onSubmitClick: function () {
                    if ($(this).hasClass('disabled')) {
                        return false;
                    }

                    if (!isUserAuth()) {
                        auth.initiator = cart.submitBtn;
                        auth.openWindow(function (guestId) {
                            userId = guestId;
                            if (cart.couponInput.val().length > 0 && !cart.couponCheck.hasClass('cancel')) {
                                cart.changeCoupon(cart.createOrder);
                            } else {
                                cart.createOrder();
                            }
                        });
                    } else {
                        if (cart.couponInput.val().length > 0 && !cart.couponCheck.hasClass('cancel')) {
                            cart.changeCoupon(cart.createOrder);
                        } else {
                            cart.createOrder();
                        }
                    }
                },
                changePersons: function (amount) {
                    $.ajax('/cart/persons/set', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            amount: amount,
                            xhr: getXhrHash()
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        }
                    });
                },
                showNotification: function (title, text) {
                    if (cart.notificationOpened) {
                        cart.notification.find('.title').html(title);
                        cart.notification.find('.text').html(text);
                        return false;
                    }

                    var content = $('.body_container'),
                        posTop = 80,
                        posRight = $(window).width() - (content.offset().left + content.outerWidth());

                    if (cart.isCartPage && !isVisible('.cart-header')) {
                        posTop = 20;
                    }

                    cart.notification.css({
                        top: posTop,
                        right: posRight
                    });

                    cart.notification.find('.title').html(title);
                    cart.notification.find('.text').html(text);
                    cart.notification.addClass('opened').animate({opacity: 1}, 200);
                    cart.notificationOpened = true;
                    setTimeout(function () {
                        cart.notification.animate({opacity: 0}, 200, function () {
                            $(this).removeClass('opened');
                            cart.notificationOpened = false;
                        });
                    }, 1500);
                },
                suggestAdded: function (dish) {
                    cart.load();
                    if (products.windowOpened) {
                        products.closeProductWindow();
                    }
                },
                addDish: function (dish, name, complete) {
                    if (typeof dish !== "object") {
                        return false;
                    }

                    var batch = {
                        product_id: '',
                        selectors: null,
                        extra_added: null,
                        price: 0,
                        return_cart: true
                    };

                    for (var key in cart.loadParams) {
                        batch[key] = cart.loadParams[key];
                    }

                    batch.product_id = dish.id;
                    batch.price = dish.total;

                    for (var i in dish.selectors) {
                        var selector = dish.selectors[i];

                        if (batch.selectors === null) {
                            batch.selectors = [];
                        }

                        batch.selectors.push({
                            group_id: selector.group_id,
                            modifier_id: selector.product_id,
                            name: selector.name,
                            price: selector.price_raw,
                            amount: 1
                        });
                    }

                    for (var i in dish.modifiers) {
                        var modifier = dish.modifiers[i];

                        if (batch.extra_added === null) {
                            batch.extra_added = [];
                        }

                        batch.extra_added.push({
                            group_id: modifier.group_id,
                            modifier_id: modifier.product_id,
                            name: modifier.name,
                            price: modifier.price_raw,
                            amount: 1
                        });
                    }

                    batch.xhr = getXhrHash();
                    $.ajax('/cart/add', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: batch,
                        beforeSend: function () {
                            cart.loading = true;
                        },
                        success: function (data) {
                            if (typeof data === "undefined") {
                                return false;
                            }

                            trackEvent('CART_ADD');
                            cart.showNotification('Добавлено', name);

                            cart.firstLoaded = true;
                            cart.data = data;
                            if (cart.isCartPage) {
                                cart.redrawPage();
                            } else {
                                cart.redrawPanel();
                            }
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            Swal.fire({
                                type: 'error',
                                title: 'Ошибка',
                                text: 'Произошла ошибка во время добавления в корзину. Попробуйте еще раз',
                                confirmButtonClass: 'btn btn-color',
                                buttonsStyling: false
                            });
                        },
                        complete: function () {
                            cart.loading = false;
                            if (typeof complete === "function") {
                                complete();
                            }
                        }
                    });
                },
                changeAmount: function (hash, amount) {
                    if (cart.loading) {
                        return false;
                    }

                    var batch = {
                        combo_hash: hash,
                        amount: amount,
                        return_cart: 1
                    };

                    for (var key in cart.loadParams) {
                        batch[key] = cart.loadParams[key];
                    }

                    batch.xhr = getXhrHash();
                    $.ajax('/cart/change', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: batch,
                        beforeSend: function () {
                            cart.loading = true;
                        },
                        success: function (data) {
                            if (typeof data === "undefined") {
                                return false;
                            }

                            cart.firstLoaded = true;
                            cart.data = data;
                            if (cart.isCartPage) {
                                cart.redrawPage();
                            } else {
                                cart.redrawPanel();
                            }
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            Swal.fire({
                                type: 'error',
                                title: 'Ошибка',
                                text: 'Произошла ошибка во время изменения количества. Попробуйте еще раз',
                                confirmButtonClass: 'btn btn-color',
                                buttonsStyling: false
                            });
                        },
                        complete: function () {
                            cart.loading = false;
                        }
                    });
                },
                openPopup: function () {
                    if (isTouchDevice()) {
                        return;
                    }

                    cart.waitPopup = true;

                    if (cart.data === null) {
                        return false;
                    }

                    if (cart.popupOpened) {
                        return false;
                    }

                    var posTop = cart.popupBtn.offset().top + cart.popupBtn.outerHeight() + 15 - $(window).scrollTop(),
                        posRight = $(window).width() - (cart.popupBtn.offset().left + cart.popupBtn.outerWidth());

                    cart.popup.css({
                        top: posTop,
                        right: posRight,
                    });

                    cart.loadParams.check_minimal = 0;
                    cart.load(function () {
                        cart.popup.addClass('opened').animate({opacity: 1}, 100);
                        cart.popupOpened = true;
                    });
                },
                closePopup: function () {
                    cart.waitPopup = false;

                    if (!cart.popupOpened) {
                        return false;
                    }

                    setTimeout(function () {
                        if (cart.waitPopup) {
                            return false;
                        }

                        cart.loadParams.check_minimal = 0;

                        cart.popup.animate({opacity: 0}, 100, function () {
                            $(this).removeClass('opened');
                        });

                        cart.popupOpened = false;
                    }, 400);
                },
                openLoader: function () {
                    if (cart.loaderOpened) {
                        return false;
                    }

                    cart.loader.removeClass('d-none').animate({opacity: 1}, 100);
                    cart.loaderOpened = true;
                },
                closeLoader: function () {
                    if (!cart.loaderOpened) {
                        return false;
                    }

                    cart.loader.addClass('d-none').css({opacity: 0});
                    cart.loaderOpened = false;
                },
                loadSuggest: function () {
                    $.ajax('/cart/suggest', {
                        cache: false,
                        dataType: 'html',
                        type: 'POST',
                        data: {
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            if (typeof data !== "string" || data.length == 0) {
                                return false;
                            }

                            $('.load_suggest').html('<div class="block-title">Рекомендуем к заказу</div>' + data);
                            setTimeout(function () {
                                products.uninit();
                                products.init();
                            }, 100);
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                    });
                }
            };

            //Автокомплит адресов
            var Autocomplete = function (kladr, addr, city, street, house, onChange) {
                var onChangeEvent = function (element) {
                    if (typeof onChange === "function") {
                        onChange(element);
                    }
                };


                var selectedStreet = street.val(),
                    selectedHouse = house.val(),
                    focusedStreetUi = null,
                    focusedHouseUi = null;

                /**
                 * Запрос для получения списка улиц по запросу
                 * @param {object} request Запрос
                 * @param {object} response Ответ
                 */
                var streetsRequest = function (request, response) {
                    $.ajax('/cart/streets/find', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            query: request.term,
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            response(data);
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                    });
                };

                /**
                 * Событие выбора улицы из списка
                 * @param {object} event Событие
                 * @param {object} ui Интрефейс
                 */
                var selectStreet = function (event, ui, isBlur) {
                    if (typeof isBlur === "undefined") {
                        isBlur = false;
                    }
                    selectedStreet = ui.item.value;
                    kladr.val(ui.item.id).trigger('keyup');
                    city.val(ui.item.city);
                    street.val(selectedStreet);
                    house.val('').removeClass('valid').removeClass('invalid').focus();
                    focusedHouseUi = null;
                    onChangeEvent(street);
                    if (!isBlur) {
                        house.focus();
                    }
                };

                /**
                 * Событие фокуса на улице
                 */
                var focusStreet = function (event, ui) {
                    focusedStreetUi = ui;
                };

                /**
                 * Запрос для получения списка домов по запросу
                 * @param {object} request Запрос
                 * @param {object} response Ответ
                 */
                var housesRequest = function (request, response) {
                    $.ajax('/cart/houses/find', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            street_id: kladr.val(),
                            query: request.term,
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            response(data);
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        },
                    });
                };

                /**
                 * Событие выбора дома из списка
                 * @param {object} event Событие
                 * @param {object} ui Интрефейс
                 */
                var selectHouse = function (event, ui) {
                    selectedHouse = ui.item.value;
                    house.attr('data-id', ui.item.id);
                    addr.val(ui.item.addr).trigger('keyup');
                    house.val(selectedHouse);
                    onChangeEvent(house);
                };

                /**
                 * Событие фокуса на доме
                 * @param {object} event Событие
                 * @param {object} ui Интрефейс
                 */
                var focusHouse = function (event, ui) {
                    focusedHouseUi = ui;
                };

                street.autocomplete({
                    minLength: 1,
                    delay: 0,
                    autoFocus: true,
                    source: streetsRequest,
                    select: selectStreet,
                    focus: focusStreet
                }).on('blur', function () {
                    if (selectedStreet != $(this).val()) {
                        if (focusedStreetUi !== null) {
                            selectStreet(null, focusedStreetUi, true);
                        } else {
                            street.val('').removeClass('valid').removeClass('invalid');
                            house.val('').removeClass('valid').removeClass('invalid');
                            focusedStreetUi = null;
                            focusedHouseUi = null;
                        }
                    }
                });

                house.autocomplete({
                    minLength: 1,
                    delay: 0,
                    autoFocus: true,
                    source: housesRequest,
                    select: selectHouse,
                    focus: focusHouse
                }).on('blur', function () {
                    if (selectedHouse != $(this).val()) {
                        if (focusedHouseUi !== null) {
                            selectHouse(null, focusedHouseUi);
                        } else {
                            house.val('').removeClass('valid').removeClass('invalid');
                            focusedHouseUi = null;
                        }
                    }
                });
            };

            //Адрес доставки
            var address = {
                dp: {
                    is_can_delivery: false
                },
                init: function () {
                    address.checking = false;
                    address.loading = false;
                    address.page = $('.cart_container .address_page');

                    if (address.page.length == 0) {
                        return false;
                    }

                    address.name = address.page.find('.guest-name input')
                        .on('keyup', address.submitCheck);
                    address.phone = address.page.find('.guest-phone input')
                        .mask('+7 000 000-00-00').on('click', address.changePhone);

                    address.selector = address.page.find('.delivery-types');
                    address.justPickup = address.selector.find('.dt_delivery.disabled').length > 0;
                    address.isPickup = address.justPickup || address.page.attr('data-type') == 'pickup';

                    address.addrPanel = address.page.find('.address-list.addr');
                    address.pickupPanel = address.page.find('.address-list.shop');
                    address.newAddrPanel = address.page.find('.cb_plate.newaddr');

                    address.addrItems = address.addrPanel.find('.al_item')
                        .on('click', address.onAddrClick);
                    address.pickupItems = address.pickupPanel.find('.al_item')
                        .on('click', address.onPickupClick);

                    if (!address.justPickup) {
                        address.isAutocomplete = address.newAddrPanel.attr('data-autocomplete') == 'on';
                        address.kladr = address.newAddrPanel.find('.hidden-kladr');
                        address.addr = address.newAddrPanel.find('.hidden-addr');
                        address.city = address.newAddrPanel.find('.hidden-city');
                        address.street = address.newAddrPanel.find('.street');
                        address.house = address.newAddrPanel.find('.house');
                        address.apartment = address.newAddrPanel.find('.apartment');
                        address.entrance = address.newAddrPanel.find('.entrance');
                        address.floor = address.newAddrPanel.find('.floor');

                        if (address.isAutocomplete) {
                            address.autocomplete = new Autocomplete(address.kladr, address.addr, address.city, address.street, address.house, function () {
                                address.addrPanel.find('.selected').removeClass('selected')
                                    .find('input').prop('checked', false);
                                address.submitCheck();
                            });
                        } else {
                            address.street.on('keyup', address.onAddrKeyUp);
                            address.house.on('keyup', address.onAddrKeyUp);
                        }
                    }

                    if (!address.justPickup && address.street.val().length == 0
                        && address.addrPanel.find('.selected').length == 0) {
                        address.addrPanel.find('.al_item:first-child').addClass('selected')
                            .find('input').prop('checked', true);
                    }

                    if (address.pickupPanel.find('.selected').length == 0) {
                        address.pickupPanel.find('.al_item:first-child').addClass('selected')
                            .find('input').prop('checked', true);
                    }

                    address.onTimeSelector = address.page.find('#ontime-select');
                    address.comment = address.page.find('.cart_comment textarea');

                    address.sidebar = $('.cart_container .cart_sidebar');

                    address.orderSumBlock = address.sidebar.find('.sp_price.pay');
                    address.deliveryPriceBlock = address.sidebar.find('.sp_price.dlv');
                    address.totalBlock = address.sidebar.find('.sp_price.total');

                    address.minimalNotice = address.sidebar.find('.minimum_order');
                    address.deliveryNotice = address.sidebar.find('.free_delivery');
                    address.zoneNotice = address.sidebar.find('.cart-notice');
                    address.submitBtn = address.sidebar.find('.sp_submit')
                        .on('click', address.bindAddress);

                    if (!address.justPickup) {
                        address.selector.find('.dt_type').on('click', address.onSelectorChange);
                    }

                    var totalText = address.totalBlock.attr('data-with'),
                        isTotalSep = totalText.indexOf(',') !== -1,
                        totalEx = totalText.split(' '),
                        currency = totalEx[totalEx.length - 1];

                    _config.currencyDecimals = isTotalSep ? 2 : 0;
                    _config.currencySymbol = currency;

                    address.updateElements();
                },
                onAddrKeyUp: function () {
                    address.addrPanel.find('.selected').removeClass('selected')
                        .find('input').prop('checked', false);
                    address.submitCheck();
                },
                changePhone: function () {
                    auth.changePhone = true;
                    auth.initiator = address.phone;
                    auth.openWindow(function () {
                        address.phone.val(auth.phoneInput.val());
                        auth.changePhone = false;
                    });
                },
                getDeliveryParams: function () {
                    if (address.checking) {
                        return false;
                    }

                    var addr = '',
                        selAddr = address.addrPanel.find('.selected');

                    if (selAddr.length > 0) {
                        var addrData = JSON.parse(selAddr.attr('data-info'));
                        if (typeof addrData.addr !== "undefined") {
                            addr = addrData.addr;
                        } else if (typeof addrData.city !== "undefined"
                            && typeof addrData.street !== "undefined" && typeof addrData.house !== "undefined") {
                            addr = addrData.city + ', ' + addrData.street + ', ' + addrData.house;
                        } else {
                            return false;
                        }
                    } else if (address.street.val().length > 0 && address.house.val().length > 0) {
                        if (address.addr.val().length > 0) {
                            addr = address.addr.val();
                        } else {
                            addr = address.city.val() + ', ' + address.street.val() + ', ' + address.house.val();
                        }
                    } else {
                        return false;
                    }

                    address.checking = true;
                    $.ajax('/cart/delivery-params', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            addr: addr,
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            if (address.isPickup) {
                                return false;
                            }
                            address.zoneNotice.addClass('d-none');
                            address.dp = data;
                            address.deliveryPriceBlock.find('.spp_sum').html(numberFormat(
                                address.dp.delivery_price,
                                _config.currencyDecimals,
                                _config.decimalSeparator,
                                _config.thousandSeparator
                            ) + ' ' + _config.currencySymbol);
                            address.totalBlock.attr('data-with', address.dp.pay_sum_with_delivery);
                            address.totalBlock.find('.spp_sum').html(address.totalBlock.attr('data-with'));
                            address.submitCheck();
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (address.isPickup) {
                                return false;
                            }
                            if (typeof xhr['responseJSON'] !== "undefined"
                                && (xhr.status == 403)) {
                                address.dp.is_can_delivery = false;
                                if (typeof xhr['responseJSON'] !== "undefined") {
                                    address.zoneNotice.html(xhr.responseJSON.error);
                                } else {
                                    address.zoneNotice.html('Адрес находится вне зоны доставки');
                                }
                                address.zoneNotice.removeClass('d-none');
                                address.submitCheck();
                            } else if (typeof xhr['responseJSON'] !== "undefined"
                                && (xhr.status == 404)) {
                                address.dp.is_can_delivery = false;
                                address.zoneNotice.addClass('d-none');
                                address.submitCheck();
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else if (xhr.status == 303) {
                                window.location = '/cart/timeout';
                            } else {
                                address.dp.is_can_delivery = false;
                                address.submitCheck();
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка во время проверки адреса',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                        },
                        complete: function () {
                            address.checking = false;
                        }
                    });
                },
                submitCheck: function () {
                    var okay = true;

                    if (address.name.val().length == 0) {
                        address.name.addClass('invalid');
                        okay = false;
                    } else {
                        address.name.removeClass('invalid');
                    }

                    if (address.isPickup) {

                        if (address.pickupItems.length == 0 || address.pickupItems.find('input:checked') == 0) {
                            okay = false;
                        }

                    } else {
                        address.getDeliveryParams();

                        if (address.addrPanel.find('input:checked').length == 0) {
                            if (address.street.val().length == 0) {
                                address.street.removeClass('valid').addClass('invalid');
                                okay = false;
                            } else {
                                address.street.removeClass('invalid').addClass('valid');
                            }

                            if (address.house.val().length == 0) {
                                address.house.removeClass('valid').addClass('invalid');
                                okay = false;
                            } else {
                                address.house.removeClass('invalid').addClass('valid');
                            }
                        }

                        if (!address.dp.is_can_delivery) {
                            if (typeof address.dp.minimum_order !== "undefined" && address.zoneNotice.hasClass('d-none')) {
                                address.minimalNotice.removeClass('d-none').find('span').html(address.dp.minimum_order + ' ' + _config.currencySymbol);
                            } else {
                                address.minimalNotice.addClass('d-none');
                            }
                            address.deliveryNotice.addClass('d-none');
                            okay = false;
                        } else {
                            if (typeof address.dp.free_delivery_left !== "undefined" && address.dp.free_delivery_left > 0) {
                                address.deliveryNotice.removeClass('d-none').find('span').html(address.dp.free_delivery_left + ' ' + _config.currencySymbol);
                            } else {
                                address.deliveryNotice.addClass('d-none');
                            }
                            address.minimalNotice.addClass('d-none');
                        }

                    }

                    if (okay) {
                        address.submitBtn.removeClass('disabled');
                    } else {
                        address.submitBtn.addClass('disabled');
                    }
                },
                updateElements: function () {
                    if (address.isPickup) {
                        address.minimalNotice.addClass('d-none');
                        address.zoneNotice.addClass('d-none');
                        address.addrPanel.addClass('d-none');
                        address.newAddrPanel.addClass('d-none');
                        address.pickupPanel.removeClass('d-none');
                        address.deliveryNotice.addClass('d-none');

                        if (address.onTimeSelector.length > 0) {
                            address.onTimeSelector.parent().find('.cco_title').html('Время самовывоза');
                        }

                        if (address.orderSumBlock.length > 0) {
                            address.orderSumBlock.addClass('d-none');
                        }

                        if (address.deliveryPriceBlock.length > 0) {
                            address.deliveryPriceBlock.addClass('d-none');
                        }

                        address.totalBlock.find('.spp_sum').html(address.totalBlock.attr('data-without'));
                    } else {
                        address.getDeliveryParams();
                        address.addrPanel.removeClass('d-none');
                        address.newAddrPanel.removeClass('d-none');
                        address.pickupPanel.addClass('d-none');

                        if (address.onTimeSelector.length > 0) {
                            address.onTimeSelector.parent().find('.cco_title').html('Время доставки');
                        }

                        if (address.orderSumBlock.length > 0) {
                            address.orderSumBlock.removeClass('d-none');
                        }

                        if (address.deliveryPriceBlock.length > 0) {
                            address.deliveryPriceBlock.removeClass('d-none');
                        }

                        address.totalBlock.find('.spp_sum').html(address.totalBlock.attr('data-with'));
                    }

                    address.submitCheck();
                },
                onSelectorChange: function () {
                    if ($(this).hasClass('selected') || $(this).hasClass('disabled')) {
                        return false;
                    }

                    $(this).parent().find('.dt_type.selected').removeClass('selected');
                    $(this).addClass('selected');

                    address.isPickup = $(this).attr('data-type') == 'pickup';
                    address.updateElements();
                },
                onPickupClick: function () {
                    $(this).parent().find('.selected').removeClass('selected')
                        .find('input').prop('checked', false);
                    $(this).addClass('selected').find('input').prop('checked', true);
                    address.submitCheck();
                },
                onAddrClick: function () {
                    $(this).parent().find('.selected').removeClass('selected')
                        .find('input').prop('checked', false);
                    $(this).addClass('selected').find('input').prop('checked', true);

                    address.kladr.val('');
                    address.addr.val('');
                    address.city.val('');
                    address.street.val('').removeClass('valid invalid');
                    address.house.val('').removeClass('valid invalid');
                    address.apartment.val('');
                    address.entrance.val('');
                    address.floor.val('');

                    address.submitCheck();
                },
                bindAddress: function () {
                    if ($(this).hasClass('disabled')) {
                        return false;
                    }

                    var data = {
                        type: address.isPickup ? 'pickup' : 'delivery',
                        name: address.name.val(),
                        on_time: address.onTimeSelector.val(),
                        comment: address.comment.val()
                    };

                    if (address.isPickup) {
                        data.shop_id = address.pickupItems.find('input:checked').val();
                    } else {

                        var selAddr = address.addrPanel.find('.selected');

                        if (selAddr.length > 0) {

                            var addrData = JSON.parse(selAddr.attr('data-info'));

                            if (typeof addrData.kladr_id !== "undefined") {
                                data.kladr_id = addrData.kladr_id;
                            }

                            if (typeof addrData.addr !== "undefined") {
                                data.addr = addrData.addr;
                            }

                            if (typeof addrData.city !== "undefined") {
                                data.city = addrData.city;
                            }

                            if (typeof addrData.street !== "undefined") {
                                data.street = addrData.street;
                            }

                            if (typeof addrData.house !== "undefined") {
                                data.house = addrData.house;
                            }

                            if (typeof addrData.apartment !== "undefined") {
                                data.apartment = addrData.apartment;
                            }

                            if (typeof addrData.entrance !== "undefined") {
                                data.entrance = addrData.entrance;
                            }

                            if (typeof addrData.floor !== "undefined") {
                                data.floor = addrData.floor;
                            }

                        } else {

                            data.kladr_id = address.kladr.val();
                            data.addr = address.addr.val();
                            data.city = address.city.val();
                            data.street = address.street.val();
                            data.house = address.house.val();
                            data.apartment = address.apartment.val();
                            data.entrance = address.entrance.val();
                            data.floor = address.floor.val();

                        }
                    }

                    data.xhr = getXhrHash();
                    $.ajax('/cart/order/bind-address', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: data,
                        beforeSend: function () {
                            address.submitBtn.addClass('disabled');
                            cart.openLoader();
                        },
                        success: function () {
                            window.location = '/cart/pay';
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (typeof xhr['responseJSON'] !== "undefined"
                                && (xhr.status == 403)) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else if (xhr.status == 303) {
                                window.location = '/cart';
                            } else if (xhr.status == 404) {
                                window.location = '/cart/timeout';
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка во время подтверждения адреса',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                            cart.closeLoader();
                        },
                        complete: function () {
                            address.submitBtn.removeClass('disabled');
                        }
                    });
                }
            };

            //Оплата
            var pay = {
                init: function () {
                    pay.loading = false;
                    pay.page = $('.cart_container .pay_page');
                    if (pay.page.length == 0) {
                        return false;
                    }

                    pay.types = pay.page.find('.pay-types .pt_selector')
                        .on('click', pay.onTypeChange);

                    pay.cashChange = pay.page.find('.cashback');
                    pay.cashChangeInput = pay.cashChange.find('input')
                        .mask('0#').on('keyup', pay.onCashInputChange)
                        .on('blur', pay.onCashInputChange);
                    pay.cashChangeLeft = pay.cashChange.find('.cash-change');

                    pay.plazius = pay.page.find('.plazius');
                    pay.isPlaziusAvailable = pay.plazius.length > 0;

                    if (pay.isPlaziusAvailable) {
                        pay.plaziusRange = pay.plazius.find('#bonusRange');

                        require(['rangeslider'], function () {
                            pay.plaziusRange.ionRangeSlider({
                                keyboard: false,
                                skin: 'round',
                                onChange: pay.onPlaziusRangeChange
                            });
                            pay.plaziusRangeInstance = pay.plaziusRange.data('ionRangeSlider');
                        });
                    }

                    pay.sidebar = $('.cart_container .cart_sidebar');
                    pay.orderSumBlock = pay.sidebar.find('.sp_price.pay');
                    pay.isOrderSumHidden = pay.orderSumBlock.hasClass('d-none');
                    pay.plaziusPayBlock = pay.sidebar.find('.sp_price.plz');
                    pay.totalBlock = pay.sidebar.find('.sp_price.total');
                    pay.submitBtn = pay.sidebar.find('.sp_submit')
                        .on('click', pay.payOrder);

                    var totalText = pay.plaziusPayBlock.attr('data-start'),
                        isTotalSep = totalText.indexOf(',') !== -1,
                        totalEx = totalText.split(' '),
                        currency = totalEx[totalEx.length - 1];

                    _config.currencyDecimals = isTotalSep ? 2 : 0;
                    _config.currencySymbol = currency;
                },
                onTypeChange: function () {
                    if ($(this).hasClass('selected')) {
                        return false;
                    }

                    $(this).parent().find('.selected').removeClass('selected')
                        .find('input').prop('checked', false)
                        .closest('.pt_selector').find('.pts_line:nth-child(2)').slideUp(100);
                    $(this).addClass('selected').find('input').prop('checked', true)
                        .closest('.pt_selector').find('.pts_line:nth-child(2)').slideDown(100);

                    pay.onCashInputChange();

                    if ($(this).find('input').attr('data-type') === 'online') {
                        pay.submitBtn.html('Оплатить заказ');
                    } else {
                        pay.submitBtn.html('Подтвердить заказ');
                    }

                    if ($(this).find('input').attr('data-type') === 'cash') {
                        pay.cashChangeInput.focus();
                    }
                },
                onCashInputChange: function () {
                    if (pay.cashChangeInput.val().length == 0
                        || pay.page.find('.pay-types input:checked').attr('data-type') !== 'cash') {
                        pay.cashChangeInput.removeClass('invalid');
                        pay.cashChangeLeft.addClass('d-none');
                        pay.submitBtn.removeClass('disabled');
                        return false;
                    }

                    var sum = parseFloat(pay.cashChangeInput.val()),
                        total = parseFloat(pay.totalBlock.attr('data-total'))
                            - parseFloat(pay.plaziusPayBlock.attr('data-plazius')),
                        left = sum - total;

                    if (sum <= total) {
                        pay.cashChangeInput.addClass('invalid');
                        pay.submitBtn.addClass('disabled');
                        pay.cashChangeLeft.addClass('d-none');
                    } else {
                        pay.cashChangeInput.removeClass('invalid');
                        pay.submitBtn.removeClass('disabled');
                        if (!isNaN(sum)) {
                            pay.cashChangeLeft.removeClass('d-none').find('span').html(numberFormat(
                                left,
                                _config.currencyDecimals,
                                _config.decimalSeparator,
                                _config.thousandSeparator
                            ) + ' ' + _config.currencySymbol);
                        }
                    }
                },
                onPlaziusRangeChange: function (data) {
                    var total = parseFloat(pay.totalBlock.attr('data-total')) - data.from;

                    pay.plaziusPayBlock.attr('data-plazius', data.from)
                        .find('.spp_sum').html('&minus;' + numberFormat(
                        data.from,
                        _config.currencyDecimals,
                        _config.decimalSeparator,
                        _config.thousandSeparator
                    ) + ' ' + _config.currencySymbol);

                    pay.totalBlock.find('.spp_sum').html(numberFormat(
                        total,
                        _config.currencyDecimals,
                        _config.decimalSeparator,
                        _config.thousandSeparator
                    ) + ' ' + _config.currencySymbol);

                    if (data.from > 0) {
                        pay.plaziusPayBlock.removeClass('d-none');

                        if (pay.isOrderSumHidden) {
                            pay.orderSumBlock.removeClass('d-none');
                        }
                    } else {
                        pay.plaziusPayBlock.addClass('d-none');

                        if (pay.isOrderSumHidden) {
                            pay.orderSumBlock.addClass('d-none');
                        }
                    }

                    pay.onCashInputChange();
                },
                payOrder: function () {
                    if ($(this).hasClass('disabled')) {
                        return false;
                    }

                    var type = pay.page.find('.pay-types input:checked').attr('data-type'),
                        varName = pay.plaziusPayBlock.attr('data-type'),
                        request = {
                            payment_type: type,
                            cash_change: type === 'cash' ? pay.cashChangeInput.val() : '',
                        };

                    request[varName] = pay.plaziusPayBlock.attr('data-plazius');
                    request['xhr'] = getXhrHash();

                    $.ajax('/cart/order/pay', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: request,
                        beforeSend: function () {
                            pay.submitBtn.addClass('disabled');
                            cart.openLoader();
                        },
                        success: function (data) {
                            if (typeof data['guid'] !== "undefined") {
                                window.location = '/cart/success?id=' + data.guid;
                            } else if (typeof data['payment'] !== "undefined"
                                && data['payment'] === 'sberbank') {
                                window.location = data.params.payment_url;
                            } else if (typeof data['payment'] !== "undefined"
                                && data['payment'] === 'cloudpayments') {
                                require(['https://widget.cloudpayments.ru/bundles/cloudpayments'], function () {

                                    cart.closeLoader();
                                    var widget = new cp.CloudPayments();
                                    widget.pay('auth', {
                                            publicId: data.params.public_id,
                                            description: 'Оплата заказа № ' + data.params.invoice_id,
                                            amount: data.params.amount,
                                            currency: 'RUB',
                                            invoiceId: data.params.invoice_id,
                                            accountId: data.params.account_id,
                                            skin: "mini",
                                            data: {
                                                name: data.params.guest_name,
                                                phone: data.params.guest_phone,
                                                address: data.params.guest_address,
                                                shop: data.params.shop_name
                                            },
                                            requireEmail: false
                                        }, {
                                            onSuccess: function () {
                                                $.ajax('/cart/order/pay/confirm', {
                                                    cache: false,
                                                    dataType: 'json',
                                                    type: 'POST',
                                                    data: {
                                                        payment_hash: data.params.payment_hash,
                                                        xhr: getXhrHash()
                                                    },
                                                    beforeSend: function () {
                                                        cart.openLoader();
                                                    },
                                                    success: function (guid) {
                                                        if (typeof guid !== "string") {
                                                            Swal.fire({
                                                                type: 'error',
                                                                title: 'Ошибка',
                                                                text: 'Произошла ошибка при подтверждении заказа',
                                                                confirmButtonClass: 'btn btn-color',
                                                                buttonsStyling: false
                                                            });
                                                            return false;
                                                        }

                                                        window.location = '/cart/success?id=' + guid;
                                                    },
                                                    error: function (xhr) {
                                                        if (_config.debug) {
                                                            console.log(xhr.responseJSON);
                                                        }
                                                        if (typeof xhr['responseJSON'] !== "undefined"
                                                            && (xhr.status == 403)) {
                                                            Swal.fire({
                                                                type: 'warning',
                                                                text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                                                confirmButtonClass: 'btn btn-color',
                                                                buttonsStyling: false
                                                            });
                                                        } else {
                                                            Swal.fire({
                                                                type: 'error',
                                                                title: 'Ошибка',
                                                                text: 'Произошла ошибка при подтверждении заказа',
                                                                confirmButtonClass: 'btn btn-color',
                                                                buttonsStyling: false
                                                            });
                                                        }
                                                    },
                                                    complete: function () {
                                                        cart.closeLoader();
                                                    }
                                                });
                                            },
                                        }
                                    );

                                });
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка при подтверждении заказа',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                                cart.closeLoader();
                            }
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                            if (typeof xhr['responseJSON'] !== "undefined"
                                && (xhr.status == 403)) {
                                Swal.fire({
                                    type: 'warning',
                                    text: typeof xhr['responseJSON'] !== "undefined" ? xhr.responseJSON.error : null,
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            } else if (xhr.status == 404) {
                                window.location = '/cart/timeout';
                            } else {
                                Swal.fire({
                                    type: 'error',
                                    title: 'Ошибка',
                                    text: 'Произошла ошибка при подтверждении заказа',
                                    confirmButtonClass: 'btn btn-color',
                                    buttonsStyling: false
                                });
                            }
                            cart.closeLoader();
                        },
                        complete: function () {
                            pay.submitBtn.removeClass('disabled');
                        }
                    });
                }
            };

            //Заказ оформлен
            var success = {
                init: function () {
                    success.page = $('.cart_container .success_page');
                    if (success.page.length == 0) {
                        return false;
                    }

                    success.status = success.page.find('.order-status');
                    if (success.status.length == 0) {
                        return false;
                    }

                    if (!success.status.hasClass('os_closed') && !success.status.hasClass('os_canceled')) {
                        success.updateInterval = setInterval(success.onUpdateInterval, 10000);
                    }
                },
                onUpdateInterval: function () {
                    var statuses = ['accepted', 'progress', 'ready', 'delivery', 'closed', 'canceled'];
                    $.ajax('/cart/order/status', {
                        cache: false,
                        dataType: 'json',
                        type: 'POST',
                        data: {
                            guid: success.status.attr('data-guid'),
                            xhr: getXhrHash()
                        },
                        success: function (data) {
                            if (success.status.hasClass(data.status)) {
                                return false;
                            }

                            for (var key in statuses) {
                                if (success.status.hasClass('os_' + statuses[key])) {
                                    success.status.removeClass('os_' + statuses[key]);
                                    break;
                                }
                            }

                            success.status.addClass('os_' + data.status);
                            success.status.html(data.status_name);

                            if (['closed', 'canceled'].indexOf(data.status) !== -1) {
                                clearInterval(success.updateInterval);
                            }
                        },
                        error: function (xhr) {
                            if (_config.debug) {
                                console.log(xhr.responseJSON);
                            }
                        }
                    });
                }
            };

            //Инициализация
            $(function () {
                $(window).on('resize', autoVh);

                $("*[data-link]").on('click', function () {
                    if ($(this).hasClass('selected') || $(this).hasClass('disabled')
                        || $(this).hasClass('empty') || $(this).attr('data-link').length == 0) {
                        return false;
                    }
                    window.location = $(this).attr('data-link');
                });

                $(document).tooltip({
                    track: false,
                    show: {
                        duration: 100
                    }
                });

                $('select.custom-select').each(function () {
                    $(this).selectmenu()
                        .selectmenu("menuWidget")
                        .addClass("ui-widget-overflow")
                        .addClass("hidescroll");
                });

                $('.switch-selector .ss_item.selected').each(function () {
                    products.selectorPositioning($(this));
                });

                auth.init();
                cart.init();
                navigation.init();
                shop.init();
                city.init();
                callback.init();
                products.init();
            });

            return {
                varDump: function (obj, level) {
                    return varDump(obj, level);
                },
                profile: function () {
                    profile.init();
                },
                cart: function () {
                    address.init();
                    pay.init();
                    success.init();
                }
            };
        }
    }());

    return App;
});