import * as Axios from "axios";
import { Instance } from './Instance';
import { ScriptInclude } from './ScriptInclude';

export class Api
{
    //Todo restrict attributes fetched to the ones used
    private _SNApiEndpoint = "/api";
    private _SNTableSuffix: string = "/now/table";
    private _SNUserTable: string = `${this._SNTableSuffix}/sys_user`;
    private _SNMetaData: string = `${this._SNTableSuffix}/sys_metadata`;
    private _SNScriptIncludeTable: string = `${this._SNTableSuffix}/sys_script_include`;

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
        }
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
    public GetRecord(sysId: string): Axios.AxiosPromise | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNMetaData}/${sysId}`;
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