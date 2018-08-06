import { URL } from "url";
import { Api } from './Api';
import * as vscode from 'vscode';
import { ScriptInclude } from './ScriptInclude';
import { IsysScriptInclude } from './IsysScriptInclude';
import { Record } from './Record';
import { IsysRecord } from "./IsysRecord";
import { WorkspaceStateManager } from "../Managers/all";


/*
   ServiceNow related Stuff
   */
//Controller Class for ServiceNow Instance
//Instantiate to reset credentials
export class Instance
{
    //optimize performance
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


    /**
     * TestConnection
    
     */
    public TestConnection()
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
                        vscode.window.showInformationMessage("Connected");
                        this.Cache();
                        this._isPasswordValid = true;
                    }
                    else
                    {
                        throw new Error("Connection failed");
                    }
                }).catch((res) =>
                {
                    vscode.window.showErrorMessage(res.message);
                    throw res;
                });
            }
        }
    }

    /**
     * GetScriptIncludes
     * Returns all available script includes as an array.
     */
    public GetScriptIncludes(): Promise<Array<ScriptInclude>>
    {
        return new Promise((resolve, reject) =>
        {
            //load from local storage first.
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
                var p = this.GetScriptIncludesUpStream();

                if (p)
                {
                    p.then((res) =>
                    {
                        resolve(res);
                    }).catch((er) =>
                    {
                        reject(er);
                    });
                }
            }
        });
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

                    let statusmessage = vscode.window.setStatusBarMessage("loading Records", include);
                    include.then((res) =>
                    {
                        if (res.data.result.length > 0)
                        {
                            res.data.result.forEach((element: IsysScriptInclude) =>
                            {
                                result.push(new ScriptInclude(element));
                            });
                            resolve(result);
                        }
                        else
                        {
                            reject("No elements Found");
                        }
                        statusmessage.dispose();
                    });
                }
            }
        });
    }

    /**
     * GetScriptInclude
     * 
     */
    public GetScriptInclude(sysId: string): Promise<ScriptInclude>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                var include = this.ApiProxy.GetScriptInclude(sysId);

                if (include)
                {
                    include.then((res) =>
                    {
                        if (res.data.result)
                        {
                            resolve(new ScriptInclude(res.data.result));
                        }
                        else
                        {
                            reject(res.data);
                        }
                    });
                }
            }
        });
    }

    /**
     * IsLatest 
     * resolves if newer is found upstream
     * rejects if latest
     */
    public IsLatest(record: IsysRecord): Promise<Record>
    {
        return new Promise((resolve, reject) =>
        {
            //get upstream record
            let p = this.GetRecord(record);

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

    //will store objects in local storage
    private Cache(): void
    {
        let p = this.GetScriptIncludesUpStream();
        p.then((res) =>
        {
            if (this._wsm)
            {
                this._wsm.SetScriptIncludes(res);
            }
        });
    }

    /**
     * GetRecord, returns record from instance via sys_metadata
     */
    private GetRecord(record: IsysRecord): Promise<Record>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                let p = this.ApiProxy.GetRecord(record.sys_id);
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

    /**
     * SetScriptInclude
     * Saves script include to current instance
     * returns an update script include object on resolve. 
     * Returns an error object on reject.
     */
    public SaveScriptInclude(scriptInclude: ScriptInclude): Promise<ScriptInclude>
    {
        return new Promise((resolve, reject) =>
        {
            if (this.ApiProxy)
            {
                let patch = this.ApiProxy.PatchScriptInclude(scriptInclude);
                if (patch)
                {
                    patch.then((res) =>
                    {
                        if (res.data.result)
                        {
                            let si = new ScriptInclude(res.data.result);
                            resolve(si);
                        }
                        else
                        {
                            //todo Turn api errors into a class?
                            reject(res.data);
                        }
                    });
                }
            }
        });
    }
}