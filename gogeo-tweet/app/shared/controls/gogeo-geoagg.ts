module gogeo {
  interface IAggValue {
    value: number;
  }

  interface IAgg {
    [aggName: string]: IAggValue;
  }

  export interface IGogeoAgg {
    aggregations: IAgg;
  }

  export class GogeoGeoagg {
    private q: any = {
      aggs: {},
      size: 0
    };

    constructor(private $http: ng.IHttpService, size?: number) {
      if (size) {
        this.q.size = size;
      }
    }

    addAgg(aggName: string, aggType: string, field: string) {
      this.q = {
        aggName: {
          aggType: {
            field: field
          }
        }
      };
    }

    execute(resultHandler: (IGogeoAgg) => void) {
      var url = Configuration.makeUrl("geoagg/db1/" + Configuration.getCollectionName() + "?mapkey=123");

      var requestData = {
        q: this.q
      };

      return this.$http
        .post<IGogeoAgg>(url, requestData)
        .success(resultHandler);
    }
  }
}