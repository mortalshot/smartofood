require([appCdn + '/assets/js/lib/config.js?ver=' + appVersion], function () {

    require(
        ['app'],
        function (App) {
            $(function () {
                'use strict';

                App().cart();

            });
        });

});
