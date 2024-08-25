import { IModelDetails } from "./IModelDetails";

export interface IListModelResponse {
        name: string;
        model: string;
        modifiedAt: Date;
        size: number;
        digest: string;
        details?: IModelDetails;
}