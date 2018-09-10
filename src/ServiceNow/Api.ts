import * as Axios from "axios";
import { Instance } from './Instance';
import { ISysMetadata } from "./ISysMetadata";
import { ISysScriptInclude } from "./ISysScriptInclude";
import { ISpWidget } from "./ISpWidget";
import { IServiceNowResponse } from "./IServiceNowResponse";
import { ISysProperty } from "./ISysProperty";
import { SysProperty } from "./SysProperty";
import { ISpTheme } from "./ISpTheme";

export class Api
{

    private _SNApiEndpoint = "/api";
    private _SNTableSuffix: string = "/now/table";
    private _SNUserTable: string = `${this._SNTableSuffix}/sys_user`;
    private _SNMetaData: string = `${this._SNTableSuffix}/sys_metadata`;
    private _SNScriptIncludeTable: string = `${this._SNTableSuffix}/sys_script_include`;
    private _SNWidgetTable: string = `${this._SNTableSuffix}/sp_widget`;
    private _SNSysProperties: string = `${this._SNTableSuffix}/sys_properties`;
    private _SNSpThemeTable: string = `${this._SNTableSuffix}/sp_theme`;
    private _Properties: Array<ISysProperty> = new Array<ISysProperty>();


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

    /**
     * return date format for connected instance
     */
    public get GetDateFormat(): string | undefined
    {
        let dateFormat = this._Properties.find((element) =>
        {
            return element.name === "glide.sys.date_format";
        });

        if (dateFormat)
        {
            return dateFormat.value;
        }
    }

    /**
     * return the Time format of connected instance
     */
    public get GetTimeFormat(): string | undefined
    {
        let dateFormat = this._Properties.find((element) =>
        {
            return element.name === "glide.sys.time_format";
        });

        if (dateFormat)
        {
            return dateFormat.value;
        }
    }

    private _HttpClient: Axios.AxiosInstance | undefined;
    public get HttpClient(): Axios.AxiosInstance | undefined
    {
        return this._HttpClient;
    }
    public set HttpClient(v: Axios.AxiosInstance | undefined)
    {
        this._HttpClient = v;
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
        let dt = date.split(' ');

        let d = dt[0];
        let t = dt[1];

        //new Date(year,month,day,hour,minute,sec)
        let DateFormat = this.GetDateFormat;
        let TimeFormat = this.GetTimeFormat;

        let f = new Date();

        //if display value is used
        if (DateFormat && TimeFormat)
        {
            f = this.GetDateFromFormat(d, DateFormat, t, TimeFormat);
        }

        //if system default is used.
        let dtNow = new Date(Date.now());

        if ((isNaN(f.getTime()) || f.getUTCFullYear() < (dtNow.getUTCFullYear() - 100) || f.getFullYear() > (dtNow.getUTCFullYear() + 100)) && TimeFormat)
        {
            f = this.GetDateFromFormat(d, "yyyy-MM-dd", t, TimeFormat);
        }

        return f;
    }

    private GetDateFromFormat(date: String, dateFormat: string, time: string, timeFormat: string): Date
    {
        let year: number;
        let month: number;
        let day: number;
        let hour: number;
        let minute: number;
        let sec: number;

        let indexYearFirst = dateFormat.indexOf("y");
        let indexYearLast = dateFormat.lastIndexOf("y") + 1;

        let indexMonthFirst = dateFormat.indexOf("M");
        let indexMonthLast = dateFormat.lastIndexOf("M") + 1;

        let indexDayFirst = dateFormat.indexOf("d");
        let indexDaylast = dateFormat.lastIndexOf("d") + 1;

        let indexHourFirst = timeFormat.indexOf("h");
        let indexHourlast = timeFormat.lastIndexOf("h") + 1;

        if (indexHourFirst === -1)
        {
            indexHourFirst = timeFormat.indexOf("H");
            indexHourlast = timeFormat.lastIndexOf("H") + 1;
        }

        let indeMinuteFirst = timeFormat.indexOf("m");
        let indeMinutelast = timeFormat.lastIndexOf("m") + 1;

        let indexSecondFirst = timeFormat.indexOf("s");
        let indexSecondlast = timeFormat.lastIndexOf("s") + 1;

        year = Number(date.substring(indexYearFirst, indexYearLast));
        month = Number(date.substring(indexMonthFirst, indexMonthLast));
        day = Number(date.substring(indexDayFirst, indexDaylast));

        hour = Number(time.substring(indexHourFirst, indexHourlast));
        minute = Number(time.substring(indeMinuteFirst, indeMinutelast));
        sec = Number(time.substring(indexSecondFirst, indexSecondlast));

        return new Date(Date.UTC(year, month - 1, day, hour, minute, sec));
    }


    /**
     * GetSystemProperties
     */
    public GetSystemProperties(): Promise<Array<ISysProperty>>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.HttpClient)
            {
                let url = `${this._SNSysProperties}?sysparm_query=nameSTARTSWITHglide.sys`;
                let o = this.HttpClient.get<IServiceNowResponse<Array<ISysProperty>>>(url);

                o.then((res) =>
                {
                    res.data.result.forEach((element) =>
                    {
                        this._Properties.push(new SysProperty(<ISysProperty>element));
                    });
                    resolve(this._Properties);
                });
            }
            else
            {
                reject("HTTPClient undefined");
            }
        });

    }

    /**
     * GetUser
     * Returns a deserialized json object form the sys_user rest api. 
     */
    public GetUser(Username: string): Axios.AxiosPromise<IServiceNowResponse<Array<ISysMetadata>>> | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNUserTable}?sysparm_limit=1&user_name=${Username}`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * return a promise with the 
     * @param record 
     */
    public GetRecord(record: ISysMetadata): Axios.AxiosPromise<IServiceNowResponse<ISysMetadata>> | undefined
    {
        switch (record.sys_class_name)
        {
            case "script_include":
                return this.GetScriptInclude(record.sys_id);
            case "widget":
                return this.GetWidget(record.sys_id);
            default:
                console.error("Record not found:");
                break;
        }
    }
    /**
     * GetRecord, returns record from sys_metadata
     */
    public GetRecordMetadata(record: ISysMetadata): Axios.AxiosPromise<IServiceNowResponse<ISysMetadata>> | undefined
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
    public GetWidgets(): Axios.AxiosPromise<IServiceNowResponse<Array<ISpWidget>>> | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNWidgetTable}?internal=false&sys_policy=""`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetWidgets
     * returns all themes that are editable
     */
    public GetThemes(): Axios.AxiosPromise<IServiceNowResponse<Array<ISpTheme>>> | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNSpThemeTable}?sys_policy=""`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetWidget
     * returns a single widget if it is editable.
     */
    public GetWidget(sysId: string): Axios.AxiosPromise<IServiceNowResponse<ISpWidget>> | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNWidgetTable}/${sysId}?internal=false&sys_policy=""`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetScriptIncludes lists all available script includes
     * only returns includes that are not restricted by sys policy
     */
    public GetScriptIncludes(): Axios.AxiosPromise<IServiceNowResponse<Array<ISysScriptInclude>>> | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNScriptIncludeTable}?sys_policy=""`;
            return this.HttpClient.get(url);
        }
    }

    /**
     * GetScriptInclude
     * returns a single script include
     */
    public GetScriptInclude(sysId: string): Axios.AxiosPromise<IServiceNowResponse<ISysScriptInclude>> | undefined
    {
        if (this.HttpClient)
        {
            let url = `${this._SNScriptIncludeTable}/${sysId}`;
            return this.HttpClient.get(url);
        }
    }


    /**
     * PatchRecord<T extends ISysMetadata>
record:T     */
    public PatchRecord<T extends ISysMetadata>(record: T): Axios.AxiosPromise<IServiceNowResponse<ISysMetadata>> | undefined
    {
        if (this.HttpClient)
        {
            let url: string;
            switch (record.sys_class_name)
            {
                case "script_include":
                    //api/now/table/sys_script_include/e0085ebbdb171780e1b873dcaf96197e
                    url = `${this._SNScriptIncludeTable}/${record.sys_id}`;

                    //@ts-ignore
                    let si = record as ISysScriptInclude;
                    //trim data to speed up patch
                    return this.HttpClient.patch<IServiceNowResponse<ISysScriptInclude>>(url, {
                        "script": si.script
                    });

                case "widget":
                    url = `${this._SNWidgetTable}/${record.sys_id}`;

                    //@ts-ignore
                    let widget = record as ISpWidget;
                    //trim data to speed up patch
                    return this.HttpClient.patch<IServiceNowResponse<ISpWidget>>(url, {
                        "script": widget.script,
                        "css": widget.css,
                        "client_script": widget.client_script,
                        'template': widget.template
                    });
                case "theme":
                    //api/now/table/sys_script_include/e0085ebbdb171780e1b873dcaf96197e
                    url = `${this._SNSpThemeTable}/${record.sys_id}`;

                    //@ts-ignore
                    let theme = record as ISpTheme;
                    //trim data to speed up patch
                    return this.HttpClient.patch<IServiceNowResponse<ISpTheme>>(url, {
                        "script": theme.css_variables
                    });

                default:
                    console.warn("PatchRecord: Record not Recognized");
                    break;
            }
        }
    }
}