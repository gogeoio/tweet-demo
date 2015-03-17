///<reference path="../shell.ts" />

/**
 * Created by danfma on 17/03/15.
 */

module gogeo {

    export class AbstractController {
        propertyName:string;
        subscriptions:Rx.IDisposable[] = [];

        /**
         * Construtor
         */
        constructor(public $scope:ng.IScope) {
        }

        /**
         * Inicializa este controlador.
         */
        initialize() {
            var selfProperty =
                Enumerable.from(this.$scope)
                    .where(x => x.value === this)
                    .select(x => x.key)
                    .firstOrDefault();
            this.propertyName = selfProperty;
            this.$scope.$on("$destroy", () => this.dispose());
        }

        dispose() {
            for (var i = 0; i < this.subscriptions.length; i++) {
                var subscription = this.subscriptions[i];
                subscription.dispose();
            }
            this.subscriptions = null;
        }

        private evalProperty<T>(path:string) {
            return this.$scope.$eval(this.propertyName + "." + path);
        }

        /**
         * Observa uma determinada propriedade desta instância.
         */
        watch<T>(property:string, handler:(newValue:T, oldValue:T) => void, objectEquality = false) {
            return this.$scope.$watch(this.propertyName + "." + property, handler, objectEquality);
        }

        /**
         * Observa uma determinada propriedade desta instância.
         */
        watchCollection<T>(property:string, handler:(newValue:T, oldValue:T) => void) {
            return this.$scope.$watchCollection(this.propertyName + "." + property, handler);
        }

        /**
         * Observer uma determinada propriedade desta instância de forma reativa.
         */
        watchAsObservable<T>(property:string, isCollection = false, objectEquality = false) {
            return Rx.Observable.createWithDisposable<T>((observer) => {
                var dispose:Function;
                if (isCollection) {
                    dispose = this.watchCollection<T>(property, (value) => {
                        observer.onNext(value);
                    });
                } else {
                    dispose = this.watch<T>(property, (value) => {
                        observer.onNext(value);
                    }, objectEquality);
                }
                return {
                    dispose: function () {
                        dispose();
                    }
                };
            });
        }

        watchObjectAsObservable<T>(property:string) {
            return this.watchAsObservable(property, undefined, true);
        }

        releaseOnDestroy(subscription:Rx.IDisposable) {
            if (subscription)
                this.subscriptions.push(subscription);
        }
    }

}