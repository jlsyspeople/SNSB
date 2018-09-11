import { URL } from "url";
import { Api } from './Api';
import * as vscode from 'vscode';
import { ScriptInclude } from './ScriptInclude';
import { ISysScriptInclude } from './ISysScriptInclude';
import { Record } from './Record';
import { ISysMetadata } from "./ISysMetadata";
import { WorkspaceStateManager } from "../Managers/all";
import { Widget } from "./Widget";
import { ISpWidget } from "./ISpWidget";
import { Theme } from "./Theme";
import { ISpTheme } from "./ISpTheme";


/*
   ServiceNow related Stuff
   */
//Controller Class for ServiceNow Instance
//Instantiate to reset credentials
export class Instance
{
    constructor(Url?: URL, UserName?: string, Password?: string, workspaceStateManager?: WorkspaceStateManager)
    {
        if (Url && UserName && Password && workspaceStateManager)
        {
            this.Initialize(Url, UserName, Password, workspaceStateManager);
        }
    }

    private _wsm: WorkspaceStateManager | undefined;


    private _userName: string | undefined;
    public get UserName(): string | undefined
    {
        if (this.IsInitialized())
        {
            return this._userName;
        }
    }

    private _url: URL | undefined;
    public get Url(): URL | undefined
    {
        if (this.IsInitialized())
        {
            return this._url;
        }
    }

    private _ApiProxy: Api | undefined;
    public get ApiProxy(): Api | undefined
    {
        if (this.IsInitialized())
        {
            return this._ApiProxy;
        }
    }
    public set ApiProxy(v: Api | undefined)
    {
        this._ApiProxy = v;
    }

    private _isPasswordValid: boolean = false;

    public get isPasswordValid(): boolean
    {
        return this._isPasswordValid;
    }

    private _hasRequiredRole: boolean = false;

    public get hasRequiredRole(): boolean
    {
        return this._hasRequiredRole;
    }

    /**
     * IsInitialized
     */
    public IsInitialized(): boolean
    {
        if (this._url && this._userName)
        {
            return true;
        }
        else
        {
            console.warn("Instance not initalized");
            return false;
        }
    }
    /**
     * Initialize
     */
    public Initialize(Url: URL, UserName: string, Password: string, wsm: WorkspaceStateManager): void
    {
        this._url = Url;
        this._userName = UserName;
        this._wsm = wsm;

        this._ApiProxy = new Api(this, Password);

        this.TestConnection();

    }
    public SaveRecord<T extends ISysMetadata>(record: T): Promise<ISysMetadata> | undefined
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                let p = this.ApiProxy.PatchRecord(record);
                if (p)
                {
                    p.then((res) =>
                    {
                        let r = new Record(res.data.result);
                        switch (r.sys_class_name)
                        {
                            case "sys_script_include":
                                resolve(new ScriptInclude(<ISysScriptInclude>res.data.result));
                                break;
                            case "sp_widget":
                                resolve(new Widget(<ISpWidget>res.data.result));
                                break;
                            case "sp_theme":
                                resolve(new Theme(<ISpTheme>res.data.result));
                                break;
                            default:
                                console.warn(`SaveRecord:  Record ${r.sys_class_name} not recognized`);
                                break;
                        }
                    }).catch((er) =>
                    {
                        console.error(er);
                    });
                }
            }
        });
    }
    /**
    * GetRecord retrieves full record from instance
    */
    public GetRecord(record: ISysMetadata): Promise<ISysMetadata>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                let p = this.ApiProxy.GetRecord(record);
                if (p)
                {
                    p.then((res) =>
                    {
                        switch (res.data.result.sys_class_name)
                        {
                            case "sys_script_include":
                                resolve(new ScriptInclude(<ISysScriptInclude>res.data.result));
                                break;
                            case "sp_widget":
                                resolve(new Widget(<ISpWidget>res.data.result));
                                break;
                            case "sp_theme":
                                resolve(new Theme(<ISpTheme>res.data.result));
                                break;
                            default:
                                console.warn(`GetRecord: Record ${res.data.result.sys_class_name} not recognized`);
                                break;
                        }
                    }).catch((er) =>
                    {
                        console.error(er);
                    });
                }
            }
        });
    }

    /**
         * GetScriptIncludes
         * Returns all available script includes as an array.
         */
    public GetScriptIncludes(): Promise<Array<ScriptInclude>>
    {
        return new Promise((resolve, reject) =>
        {
            if (this._wsm)
            {
                let si = this._wsm.GetScriptIncludes();
                if (si)
                {
                    resolve(si);
                }
            }
            else
            {
                reject("No records found");
            }
        });
    }

    /**returns all cached widgets */
    public GetWidgets(): Promise<Widget[]>
    {
        return new Promise((resolve, reject) =>
        {
            if (this._wsm)
            {
                let wi = this._wsm.GetWidgets();
                if (wi)
                {
                    resolve(wi);
                }
            }
            else
            {
                reject("No records found");
            }
        });
    }

    /**returns all cached widgets */
    public GetThemes(): Promise<Theme[]>
    {
        return new Promise((resolve, reject) =>
        {
            if (this._wsm)
            {
                let t = this._wsm.GetThemes();
                if (t)
                {
                    resolve(t);
                }
            }
            else
            {
                reject("No records found");
            }
        });
    }


    /**
     * IsLatest 
     * resolves if newer is found upstream
     * rejects if latest
     */
    public IsLatest(record: ISysMetadata): Promise<ISysMetadata>
    {
        return new Promise((resolve, reject) =>
        {
            //get upstream record
            let p = this.GetRecordMetadata(record);

            p.then((res) =>
            {
                //fix this comparison
                if (res.sys_updated_on > record.sys_updated_on)
                {
                    //upstream newest
                    resolve(res);
                }
                else
                {
                    reject(res);
                }
            }).catch((e) =>
            {
                console.error(e);
                throw e;
            });
        });
    }

    /**
     * RebuildCache
     */
    public RebuildCache()
    {
        this.Cache();
    }

    /**
     * TestConnection
    
     */
    private TestConnection(): void
    {
        this._hasRequiredRole = false;
        this._isPasswordValid = false;
        if (this.ApiProxy && this.UserName)
        {
            let promise = this.ApiProxy.GetUser(this.UserName);
            if (promise)
            {
                promise.then((res) =>
                {
                    if (res.data.result.length === 1)
                    {
                        //@ts-ignore
                        let i = this.ApiProxy.GetSystemProperties();
                        vscode.window.showInformationMessage("Connected");
                        this._isPasswordValid = true;
                        if (i)
                        {
                            i.then((res) =>
                            {
                                this.Cache();
                            });
                        }
                    }
                    else
                    {
                        throw new Error("Connection failed");
                    }
                }).catch((res) =>
                {
                    vscode.window.showErrorMessage(res.message);
                });
            }
        }
    }

    private GetScriptIncludesUpStream(): Promise<Array<ScriptInclude>>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                var include = this.ApiProxy.GetScriptIncludes();

                if (include)
                {
                    let result = new Array<ScriptInclude>();

                    include.then((res) =>
                    {
                        res.data.result.forEach((element) =>
                        {
                            result.push(new ScriptInclude(<ISysScriptInclude>element));
                        });
                        resolve(result);

                    }).catch((er) =>
                    {
                        console.error(er);
                    });
                }
            }
        });
    }

    private GetWidgetsUpStream(): Promise<Array<Widget>>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                var include = this.ApiProxy.GetWidgets();

                if (include)
                {
                    let result = new Array<Widget>();

                    include.then((res) =>
                    {
                        if (res.data.result.length > 0)
                        {
                            res.data.result.forEach((element) =>
                            {
                                result.push(new Widget(<ISpWidget>element));
                            });
                            resolve(result);
                        }
                        else
                        {
                            reject("No elements Found");
                        }
                    }).catch((er) =>
                    {
                        console.error(er);
                    });
                }
            }
        });
    }

    private GetThemesUpStream(): Promise<Array<Theme>>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                var include = this.ApiProxy.GetThemes();

                if (include)
                {
                    let result = new Array<Theme>();

                    include.then((res) =>
                    {
                        if (res.data.result.length > 0)
                        {
                            res.data.result.forEach((element) =>
                            {
                                result.push(new Theme(<ISpTheme>element));
                            });
                            resolve(result);
                        }
                        else
                        {
                            reject("No elements Found");
                        }
                    }).catch((er) =>
                    {
                        console.error(er);
                    });
                }
            }
        });
    }

    //will store objects in local storage
    private Cache(): void
    {
        if (this.IsInitialized)
        {
            let includes = this.GetScriptIncludesUpStream();

            let sMsg = vscode.window.setStatusBarMessage("Loading Script Includes", includes);
            includes.then((res) =>
            {
                if (this._wsm)
                {
                    this._wsm.SetScriptIncludes(res);
                }
                sMsg.dispose();
            }).catch((e) =>
            {
                console.error(e);
                sMsg.dispose();
            });

            let widgets = this.GetWidgetsUpStream();

            let wMsg = vscode.window.setStatusBarMessage("Loading Widgets", widgets);

            widgets.then((res) =>
            {
                if (this._wsm)
                {
                    this._wsm.SetWidgets(res);
                }
                wMsg.dispose();
            }).catch((er) =>
            {
                console.error(er);
                wMsg.dispose();
            });

            let themes = this.GetThemesUpStream();
            let tMsg = vscode.window.setStatusBarMessage("Loading Widgets", themes);
            themes.then((res) =>
            {
                if (this._wsm)
                {
                    this._wsm.SetThemes(res);
                }
                tMsg.dispose();
            }).catch((er) =>
            {
                console.error(er);
                tMsg.dispose();
            });
        }
    }



    /**
     * GetRecord, returns record metadata from instance
     * 
     */
    private GetRecordMetadata(record: ISysMetadata): Promise<ISysMetadata>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                let p = this.ApiProxy.GetRecordMetadata(record);
                if (p)
                {
                    p.then((res) =>
                    {
                        if (res.data.result)
                        {
                            let r = new Record(res.data.result);
                            resolve(r);
                        }
                        else
                        {
                            reject(res.data);
                        }
                    }).catch((er) =>
                    {
                        console.error(er);
                    });
                }
                else
                {
                    reject("axios Promise is null or undefined");
                }
            }
            else
            {
                reject("API Proxy is null or undefined");
            }
        });

    }
}