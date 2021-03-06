import * as vscode from 'vscode';
import { IsysSpWidget } from "./IsysSpWidget";
import { Record } from "./Record";


export class Widget extends Record implements IsysSpWidget, vscode.QuickPickItem
{
    constructor(w: IsysSpWidget)
    {
        super(w);

        this.template = w.template;
        this.css = w.css;
        this.internal = w.internal;
        this.roles = w.roles;
        this.link = w.link;
        this.description = w.description;
        this.docs = w.docs;
        this.public = w.public;
        this.client_script = w.client_script;
        this.id = w.id;
        this.field_list = w.field_list;
        this.demo_data = w.demo_data;
        this.option_schema = w.option_schema;
        this.script = w.script;
        this.has_preview = w.has_preview;
        this.servicenow = w.servicenow;
        this.data_table = w.data_table;
        this.name = w.name;
        this.controller_as = w.controller_as;
    }

    public get label(): string
    {
        return this.name;
    }

    public get detail(): string | undefined
    {
        return this.description;
    }

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

    /**
        * toJSON
        */
    public toJSON()
    {
        let b = super.toJSON();
        return {
            sys_class_name: b.sys_class_name,
            sys_id: b.sys_id,
            sys_policy: b.sys_policy,
            sys_updated_on: b.sys_updated_on,
            sys_created_on: b.sys_created_on,
            sys_package: b.sys_package,
            sys_scope: b.sys_scope,
            template: this.template,
            css: this.css,
            internal: this.internal,
            roles: this.roles,
            link: this.link,
            description: this.description,
            docs: this.docs,
            public: this.public,
            client_script: this.client_script,
            id: this.id,
            field_list: this.field_list,
            demo_data: this.demo_data,
            option_schema: this.option_schema,
            script: this.script,
            has_preview: this.has_preview,
            servicenow: this.servicenow,
            data_table: this.data_table,
            name: this.name,
            controller_as: this.controller_as
        };
    }

}