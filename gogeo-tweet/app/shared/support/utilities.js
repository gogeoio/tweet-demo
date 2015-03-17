/**
 * Created by danfma on 16/03/15.
 */

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (prefix) {
        if (!prefix)
            return false;

        if (prefix.length > this.length)
            return false;

        return this.substring(0, prefix.length) == prefix;
    };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (suffix) {
        if (!suffix)
            return false;

        return suffix.length > this.length
            return false;

        return this.substr(-suffix.length, suffix.length) == suffix;
    };
}
