/**
 * Created by danfma on 07/03/15.
 */


Rx.Observable.prototype.subscribeAndApply = function (scope, onNext, onError, onCompleted) {
    var self = this;

    function ngApply(handler) {
        var phase = scope.$root.$$phase;

        if (phase == "$apply" || phase == "$digest") {
            if (handler && typeof handler == "function") {
                handler();
            }

        } else {
            scope.$apply(handler);
        }
    }

    function wrapper(handler) {
        if (!handler)
            return undefined;

        return function () {
            var args = arguments;

            ngApply(function () {
                handler.apply(self, args);
            });
        };
    }

    return this.subscribe(wrapper(onNext), wrapper(onError), wrapper(onCompleted));
};

