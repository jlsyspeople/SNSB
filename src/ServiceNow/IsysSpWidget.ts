import { IsysRecord } from "./IsysRecord";

export interface IsysSpWidget extends IsysRecord
{
    template: string;
    css: string;
    internal: boolean;
    roles: string;
    link: string;
    description: string;
    docs: string;
    public: boolean;
    client_script: string;
    id: string;
    field_list: string;
    demo_data: string;
    option_schema: string;
    script: string;
    has_preview: boolean;
    servicenow: boolean;
    data_table: string;
    name: string;
    controller_as: string;
}
