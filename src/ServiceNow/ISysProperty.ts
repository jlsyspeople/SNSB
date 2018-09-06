import { IsysRecord } from './IsysRecord';
export interface IsysProperty extends IsysRecord
{
    name: string;
    value: string;
    type: boolean;
}