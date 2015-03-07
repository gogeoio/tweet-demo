/// <reference path="../../typings/rx/rx-lite.d.ts" />

/**
 * Created by danfma on 07/03/15.
 */


declare module Rx {

    export interface Observable<T> {
        subscribeAndApply(scope: ng.IScope, onNext?: (value: T) => void, onError?: (exception: any) => void, onCompleted?: () => void): Rx.IDisposable;
    }

}
