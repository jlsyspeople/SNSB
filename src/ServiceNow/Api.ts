import * as Axios from "axios";
import { Instance } from './Instance';
import { ScriptInclude } from './ScriptInclude';
import { IsysRecord } from "./IsysRecord";
import { Widget } from "./Widget";

export class Api
{

    private _SNApiEndpoint = "/api";
    private _SNTableSuffix: string = "/now/table";
    private _SNUserTable: string = `${this._SNTableSuffix}/sys_user`;
    private _SNMetaData: string = `${this._SNTableSuffix}/sys_metadata`;
    private _SNScriptIncludeTable: string = `${this._SNTableSuffix}/sys_script_include`;
    private _SNWidgetTable: string = `${this._SNTableSuffix}/sp_widget`;


    private _HttpClient: Axios.AxiosInstance | undefined;
    public get HttpClient(): Axios.AxiosInstance | undefined
    {
        return this._HttpClient;
    }
    public set HttpClient(v: Axios.AxiosInstance | undefined)
    {
        this._HttpClient = v;
    }

    /**
     * Setup class, Currently only basic auth.
     */
    constructor(Instance: Instance, Password: string)
    {
        if (Instance.Url && Instance.UserName)
        {
            let host: string;
            if (Instance.Url.href.endsWith('/'))
            {
                host = Instance.Url.href.slice(0, Instance.Url.href.length - 1);
            }
            else
            {
                host = Instance.Url.href;
            }

            let fullUrl = host + this._SNApiEndpoint;

            this._HttpClient = Axios.default.create({
                baseURL: fullUrl,
                timeout: 3000,
                auth: {
                    username: Instance.UserName,
                    password: Password
                }
            });

            //convert date values to Iso 8106
            this._HttpClient.interceptors.response.use((v) =>
            {
                if (v.data.result)
                {
                    if (v.data.result instanceof Array)
                    {
                        let arr = new Array<any>();
                        // @ts-ignore
                        v.data.result.forEach(element =>
                        {
                            element = this.fixDateOnRecord(element);
                            arr.push(element);
                        });
                        v.data.result = arr;
                    }
                    else
                    {
                        if (v.data.result)
                        {
                            v.data.result = this.fixDateOnRecord(v.data.result);
                        }
                    }
                }
                return v;
            });
        }
    }

    // @ts-ignore
    private fixDateOnRecord(record)
    {

        if (record.sys_updated_on)
        {
            let date = record.sys_updated_on as string;

            record.sys_updated_on = this.getDateFromServiceNowTime(date);
        }
        if (record.sys_created_on)
        {
            let date = record.sys_created_on as string;

            record.sys_created_on = this.getDateFromServiceNowTime(date);
        }

        return record;
    }

    private getDateFromServiceNowTime(date: string): Date
    {
        // yyyy-mm-dd hh:mm:ss
        // 2018-08-06 12:51:39
        // dd/mm/yyyy
        // 06/08/2018
        var dt = date.split(' ');

        let d = dt[0];
        let t = dt[1];

        let dSplit;

        let year: number;
        let month: number;
        let day: number;

        if (d.includes("/"))
        {
            dSplit = d.split('/');
            year = Number.parseInt(dSplit[2]);
            month = Number.parseInt(dSplit[1]) - 1;
            day = Number.parseInt(dSplit[0]);
        }
        else
        {
            dSplit = d.split('-');
            year = Number.parseInt(dSplit[0]);
            month = Number.parseInt(dSplit[1]) - 1;
            day = Number.parseInt(dSplit[2]);
        }

        let tSplit = t.split(':');

        let f = new Date(year, month, day, Number.parseInt(tSplit[0]), Number.parseInt(tSplit[1]), Number.parseInt(tSplit[2]));

        return f;
    }

    /**
     * GetUser
     * Returns a deserialized json object form the sys_user rest api. 
     */
    public GetUser(Username: string): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNUserTable}?sysparm_limit=1&user_name=${Username}&sysparm_display_value=true`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetRecord, returns record from sys_metadata
     */
    public GetRecord(record: IsysRecord): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNMetaData}/${record.sys_id}`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetWidgets
     * returns all widgets that are editable
     */
    public GetWidgets(): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNWidgetTable}?internal=false&sys_policy=""&sysparm_display_value=true`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetWidget
     * returns a single widget if it is editable.
     */
    public GetWidget(sysId: string): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNWidgetTable}/${sysId}?internal=false&sys_policy=""&sysparm_display_value=true`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetScriptIncludes lists all available script includes
     * only returns includes that are not restricted by sys policy
     */
    public GetScriptIncludes(): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNScriptIncludeTable}?sys_policy=""&sysparm_display_value=true`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetScriptInclude
     * returns a single script include
     */
    public GetScriptInclude(sysId: string): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNScriptIncludeTable}/${sysId}?sysparm_display_value=true`;
            return this.HttpClient.get(url);
        }
    }

    PatchWidget(widget: Widget): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNWidgetTable}/${widget.sys_id}`;
            //trim data to speed up patch
            let p = this.HttpClient.patch<Widget>(url, {
                "script": widget.script,
                "css": widget.css,
                "client_script": widget.client_script
            });
            return p;
        }
    }

    /**
     * PatchScriptInclude
     */
    public PatchScriptInclude(scriptInclude: ScriptInclude): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            //api/now/table/sys_script_include/e0085ebbdb171780e1b873dcaf96197e
            let url = `${this._SNScriptIncludeTable}/${scriptInclude.sys_id}`;
            //trim data to speed up patch
            let p = this.HttpClient.patch<ScriptInclude>(url, {
                "script": scriptInclude.script
            });
            return p;
        }
    }
}