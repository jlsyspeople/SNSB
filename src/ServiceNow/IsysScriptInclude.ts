import {IsysRecord} from './IsysRecord';

export interface IsysScriptInclude extends IsysRecord
    {
        client_callable: boolean;
        access: string;
        active: boolean;
        description: string;
        script: string;
        api_name: string;
        name: string;
    }