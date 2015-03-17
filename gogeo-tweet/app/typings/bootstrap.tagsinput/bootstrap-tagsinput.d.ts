/// <reference path="../jquery/jquery.d.ts" />

/**
 * Created by danfma on 11/03/15.
 */


interface JQuery {
    tagsinput(config: bootstrap.tagsinput.IConfig): JQuery;
}

declare module bootstrap.tagsinput {

    interface IConfig {
        tagClass?: string | Function;
        itemValue?: string;
        itemText?: string;
        confirmKeys?: Array<number>;
        maxTags?: number;
        maxChars?: number;
        trimValue?: boolean;
        allowDuplicates?: boolean;
        freeInput?: boolean;
        typeahead?: ITypeAhead<any>;
    }

    interface ITypeAhead<T> {
        source: T[] | IPromiseFactory<T> | IDirectSource<T>;
    }

    interface IPromiseFactory<T> {
        (query: string): JQueryPromise<T>;
    }

    interface IDirectSource<T> {
        (query: string): T[];
    }

}
