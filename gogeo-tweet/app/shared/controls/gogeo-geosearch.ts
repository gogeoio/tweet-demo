module gogeo {
  export class GogeoGeosearch {

    private requestData: any = {};

    geom: IGeom = null;
    buffer: number = 0;
    buffer_measure: string = null;
    q: any = {};
    limit: number = 0;
    fields: Array<string> = [];

    constructor(
      private $http: ng.IHttpService,
      geom: IGeom,
      buffer: number,
      buffer_measure: string,
      fields: Array<string>,
      limit: number,
      query?: any) {

      this.geom = geom;
      this.buffer = buffer;
      this.buffer_measure = buffer_measure;
      this.fields = fields;
      this.limit = limit;
      this.q = angular.toJson(query);
    }

    execute(resultHandler: (ITweet) => void) {
      var url = Configuration.makeUrl("geosearch/db1/tweets?mapkey=123");

      this.requestData = {
        geom: this.geom,
        limit: this.limit,
        buffer: this.buffer,
        buffer_measure: this.buffer_measure,
        fields: this.fields,
        q: this.q
      }

      return this.$http
        .post<Array<ITweet>>(url, this.requestData)
        .success(resultHandler);
    }

  }
}