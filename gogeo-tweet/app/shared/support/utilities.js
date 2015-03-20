/**
 * Created by danfma on 16/03/15.
 */

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (prefix) {
        if (!prefix)
            return false;

        var cond = this.substring(0, prefix.length);

        return cond == prefix;
    };
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}