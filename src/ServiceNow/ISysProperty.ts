import { ISysMetadata } from './ISysMetadata';
export interface ISysProperty extends ISysMetadata
{
    name: string;
    value: string;
    type: boolean;
}