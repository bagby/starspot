import getRawBody = require("raw-body");
import { Readable } from "stream";
import Application from "./application";
import Container from "./container";

interface Controller {
  index?<T>(params: Controller.Parameters): T[] | T | Promise<T[]> | Promise<T> | void;
  show?<T>(params: Controller.Parameters): T[] | T | Promise<T[]> | Promise<T> | void;
  create?<T>(params: Controller.Parameters): T[] | T | Promise<T[]> | Promise<T> | void;
  update?<T>(params: Controller.Parameters): T[] | T | Promise<T[]> | Promise<T> | void;
  delete?<T>(params: Controller.Parameters): T[] | T | Promise<T[]> | Promise<T> | void;
}

class Controller {
  createModel<T>(modelName: string): T {
    let Model = this.findModel(modelName) as any;
    return new Model();
  }

  findModel<T>(modelName: string): T {
    let container = Container.metaFor(this).container;
    return container.findFactory("model", modelName);
  }
}

export default Controller;

namespace Controller {
  export interface ParameterConstructorOptions {
    request: Application.Request;
    response: Application.Response;
    action: string;
    controllerName: string;
    urlParams?: { [key: string]: any };
    queryParams?: { [key: string]: any };
  }

  export class Parameters {
    request: Application.Request;
    response: Application.Response;
    action: string;
    controllerName: string;
    context: Controller.Context;
    urlParams: {};
    queryParams: {};

    _json: Promise<any>;

    constructor(options: ParameterConstructorOptions) {
      this.request = options.request;
      this.response = options.response;
      this.action = options.action;
      this.controllerName = options.controllerName;
      this.urlParams = options.urlParams;
      this.queryParams = options.queryParams;
      this.context = {};
    }

    json(): Promise<any> {
      if (this._json) {
        return this._json;
      }

      let request = this.request;
      let body: Promise<string | Buffer>;

      if (request instanceof Readable) {
        body = getRawBody(request);
      } else if (request.body !== undefined) {
        body = Promise.resolve(request.body);
      } else {
        return Promise.resolve(null);
      }

      this._json = body.then(data => {
        data = data.toString();

        if (!data) {
          return;
        }

        return JSON.parse(data);
      });

      return this._json;
    }
  }

  /**
   * Dictionary allowing middleware/decorators to provide information to controllers alongside the JSON API payload
   */
  export interface Context {
    [key: string]: any;
  }
}
