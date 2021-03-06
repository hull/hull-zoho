import { Request, Response, RequestHandler } from "express";
import { AwilixContainer } from "awilix";
import { SyncAgent } from "../core/sync-agent";
import { cloneDeep } from "lodash";
import { Logger } from "winston";
import { FieldsSchema } from "../types/fields-schema";

export const metaActionFactory = (): RequestHandler => {
  return async (req: Request, res: Response): Promise<unknown> => {
    let logger: Logger | undefined;
    let correlationKey: string | undefined;
    try {
      const scope = (req as any).scope as AwilixContainer;
      logger = scope.resolve<Logger>("logger");
      correlationKey = scope.resolve<string>("correlationKey");
      const syncAgent = new SyncAgent(scope);
      const metaCategory = req.params.category as string;
      let responsePayload: FieldsSchema = {
        error: null,
        ok: true,
        options: [],
      };
      switch (metaCategory) {
        case "fields":
          responsePayload = await syncAgent.listMetadata(
            req.params.objectType,
            req.params.direction,
          );
          break;
        case "identity":
          responsePayload = await syncAgent.listMetadataIdentity(
            req.params.objectType,
            req.params.direction,
          );
          break;
        default:
          responsePayload.error = `Unknown category '${metaCategory}'.`;
          responsePayload.ok = false;
          break;
      }
      res.status(200).json(responsePayload);
      return Promise.resolve(true);
    } catch (error) {
      if (logger) {
        logger.error({
          code: `ERR-01-001`,
          message: `Unhandled exception at route '${req.method} ${req.url}'`,
          correlationKey,
          errorDetails: cloneDeep(error),
        });
      }
      res
        .status(500)
        .send({ message: "Unknown error", error: { message: error.message } });
      return Promise.resolve(false);
    }
  };
};
