import { ISysMetadata } from "./ISysMetadata";

//interface of response from table API
export interface IServiceNowResponse
{
    result: ISysMetadata;
}

export interface IServiceNowResponseArray
{
    result: Array<ISysMetadata>;
}