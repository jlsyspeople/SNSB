import { IsysRecord } from "./IsysRecord";

//interface of response from table API
export interface IServiceNowResponse
{
    result: IsysRecord;
}

export interface IServiceNowResponseArray
{
    result: Array<IsysRecord>;
}