import { URL } from "url";
import * as Axios from "axios";
import * as vscode from 'vscode';
import * as fileSystem from 'fs';

export namespace ServiceNow
{
    /*VsCode Stuff*/
    export enum StateKeys
    {
        instance,
        url,
        user,
        password
    }

    export class WorkspaceManager
    {
        constructor()
        {
        }

        /**
         * Addinstance Creates the base folder structure in workspace.
         */
        public AddInstanceFolder(i: Instance): void
        {
            if (this.HasWorkspace())
            {
                let path = this.GetPathInstance(i);
                if (path)
                {
                    this.CreateFolder(path);
                }
            }
        }

        /**
         * AddScriptInclude
         */
        public AddScriptInclude(record: ScriptInclude, instance: Instance)
        {
            let instancePath = this.GetPathInstance(instance);

            if (instancePath)
            {
                //todo Create folder scriptinclude
                let includedir = `${instancePath}\\ScriptInclude`;
                this.CreateFolder(includedir);

                let MetaDir = `${includedir}\\${record.name}`;
                this.CreateFolder(MetaDir);

                //todo Create Metadatasysfile
                this.CreateFile(`${MetaDir}\\${record.name}.options.json`, JSON.stringify(record));

                //todo Create Script file.
                this.CreateFile(`${MetaDir}\\${record.name}.script.js`, record.script);
            }
        }

        private GetPathInstance(i: Instance): string | undefined
        {
            let workspaceRoot = this.GetWorkspaceFolder();

            if (workspaceRoot)
            {
                let path = `${workspaceRoot.uri.fsPath}\\${i.Url.host}`;
                return path;
            }
        }

        private GetWorkspaceFolder(): vscode.WorkspaceFolder | undefined
        {
            if (this.HasWorkspace)
            {
                if (vscode.workspace.workspaceFolders !== undefined)
                {
                    let workspaceRoot = vscode.workspace.workspaceFolders[0];
                    return workspaceRoot;
                }
            }
        }

        private HasWorkspace(): boolean
        {
            return vscode.workspace.name !== undefined;
            if (vscode.workspace.name !== undefined)
            {
                return true;
            }
            else
            {
                vscode.window.showErrorMessage("a workspace is required");
                return false;
            }
        }

        private CreateFolder(path: string)
        {
            if (!this.FolderExist(path))
            {
                fileSystem.mkdir(path, (res) =>
                {
                    //only exceptions is parsed on callback 
                    if (res)
                    {
                        vscode.window.showErrorMessage(res.message);
                    }
                    else
                    {
                        vscode.window.showInformationMessage("Folder created");
                    }
                });
            }
        }

        private FolderExist(path: string): boolean
        {
            try
            {
                fileSystem.readdirSync(path);
                console.error(`Folder Already Exist: ${path}`);
                return true;
            }
            //throws if no folder by that name exist
            catch (error)
            {

                return false;
            }
        }

        private CreateFile(path: string, value: string): void
        {
            if (!this.FileExist(path))
            {
                fileSystem.writeFile(path, value, 'utf8', (err) => { console.error(err.message); });
            }
        }

        private FileExist(path: string): boolean
        {
            try
            {
                fileSystem.readFileSync(path);
                console.error(`File Already Exist: ${path}`);
                return true;
            }
            catch (error)
            {
                return false;
            }
        }
    }

    /*
    ServiceNow related Stuff
    */
    //Controller Class for ServiceNow Instance
    //Instantiate to reset credentials
    export class Instance
    {
        private _userName: string;
        public get UserName(): string
        {
            return this._userName;
        }

        private _url: URL;
        public get Url(): URL
        {
            return this._url;
        }

        private _ApiProxy: ServiceNow.Api;
        public get ApiProxy(): ServiceNow.Api
        {
            return this._ApiProxy;
        }
        public set ApiProxy(v: ServiceNow.Api)
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

        constructor(Url: URL, UserName: string, Password: string)
        {
            this._url = Url;
            this._userName = UserName;

            this._ApiProxy = new ServiceNow.Api(this, Password);
            this.TestConnection();
        }

        /**
         * TestConnection
        
         */
        public TestConnection()
        {
            this._hasRequiredRole = false;
            this._isPasswordValid = false;
            // todo move logic to api proxy class
            this.ApiProxy.GetUser(this.UserName).then((res) =>
            {
                if (res.data.result.length === 1)
                {
                    vscode.window.showInformationMessage("Connected");
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

        /**
         * GetScriptIncludes
         */
        public GetScriptIncludes()
        {
            throw (new Error("Not implemented"));
        }

        /**
         * ListScriptIncludes
         */
        public ListScriptIncludes(): Promise<Array<ScriptInclude>>
        {
            return new Promise((resolve, reject) =>
            {
                var availableIncludes = this.ApiProxy.ListScriptIncludes();

                let result = new Array<ScriptInclude>();
                availableIncludes.then((res) =>
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
                });
            });
        }

    }

    export class Api
    {
        private _SNApiEndpoint = "/api";
        private _SNTableSuffix: string = "/now/table";
        private _SNUserTable: string = `${this._SNTableSuffix}/sys_user`;
        private _SNScriptIncludeTable: string = `${this._SNTableSuffix}/sys_script_include`;

        private _HttpClient: Axios.AxiosInstance;
        public get HttpClient(): Axios.AxiosInstance
        {
            return this._HttpClient;
        }
        public set HttpClient(v: Axios.AxiosInstance)
        {
            this._HttpClient = v;
        }

        /**
         * Setup class, Currently only basic auth.
         */
        constructor(Instance: Instance, Password: string)
        {
            //todo check and remove possible //
            let fullUrl = Instance.Url.href + this._SNApiEndpoint;

            this._HttpClient = Axios.default.create({
                baseURL: fullUrl,
                timeout: 30000,
                auth: {
                    username: Instance.UserName,
                    password: Password
                }
            });
        }

        /**
         * GetUser
         * Returns a deserialized json object form the sys_user rest api. 
         */
        public GetUser(Username: string)
        {
            let httpclient = this.HttpClient;
            let url = `${this._SNUserTable}?sysparm_limit=1&user_name=${Username}&sysparm_display_value=true`;
            return httpclient.get(url);
        }

        /**
         * GetScriptInclude gets and loads a single Include
         */
        public GetScriptInclude(name: string): void
        {

        }


        /**
         * ListScriptIncludes lists all available script includes
         */
        public ListScriptIncludes(): Axios.AxiosPromise
        {

            let url = `${this._SNScriptIncludeTable}?sys_policy=""&sysparm_display_value=true`;
            return this._HttpClient.get(url);


        }
    }

    interface IsysRelation
    {
        link: string;
        display_value: string;
    }

    //related serviceNow entity
    class Relation implements IsysRelation
    {
        _link: string;
        public get link(): string
        {
            return this._link;
        }

        _display_value: string;
        public get display_value(): string
        {
            return this._display_value;
        }

        constructor(o: IsysRelation)
        {
            this._link = o.link;
            this._display_value = o.display_value;
        }
    }


    //Interface declaring fields used from sys_metadata
    interface IsysRecord
    {
        sys_class_name: string;
        sys_id: string;
        sys_policy: string;
        sys_updated_on: Date;
        sys_created_on: Date;
        sys_package: Relation;
        sys_scope: Relation;
    }

    //class with base attributes of any record in ServiceNow.
    class Record implements IsysRecord
    {
        constructor(o: IsysRecord)
        {
            this._sys_class_name = o.sys_class_name;
            this._sys_id = o.sys_id;
            this._sys_policy = o.sys_policy;
            this._sys_updated_on = o.sys_updated_on;
            this._sys_created_on = o.sys_created_on;
            this._sys_package = new Relation(o.sys_package);
            this._sys_scope = new Relation(o.sys_scope);
        }

        private _sys_class_name: string;
        public get sys_class_name(): string
        {
            return this._sys_class_name;
        }

        private _sys_id: string;
        public get sys_id(): string
        {
            return this._sys_id;
        }

        private _sys_policy: string;
        public get sys_policy(): string
        {
            return this._sys_policy;
        }

        private _sys_updated_on: Date;
        public get sys_updated_on(): Date
        {
            return this._sys_updated_on;
        }

        private _sys_created_on: Date;
        public get sys_created_on(): Date
        {
            return this._sys_created_on;
        }

        private _sys_package: Relation;
        public get sys_package(): Relation
        {
            return this._sys_package;
        }

        private _sys_scope: Relation;
        public get sys_scope(): Relation
        {
            return this._sys_scope;
        }
    }

    interface IsysScriptInclude extends IsysRecord
    {
        client_callable: boolean;
        access: string;
        active: boolean;
        description: string;
        script: string;
        api_name: string;
        name: string;
    }

    class ScriptInclude extends Record implements IsysScriptInclude, vscode.QuickPickItem
    {
        constructor(si: IsysScriptInclude)
        {
            super(si);
            this._client_callable = si.client_callable;
            this._access = si.access;
            this._active = si.active;
            this._description = si.description;
            this._script = si.script;
            this._api_name = si.api_name;
            this._name = si.name;
        }

        public get label(): string
        {
            return this.name;
        }

        public get detail(): string | undefined
        {
            return this.description;
        }

        private _client_callable: boolean;
        public get client_callable(): boolean
        {
            return this._client_callable;
        }
        public set client_callable(v: boolean)
        {
            this._client_callable = v;
        }

        private _access: string;
        public get access(): string
        {
            return this._access;
        }
        public set access(v: string)
        {
            this._access = v;
        }

        private _active: boolean;
        public get active(): boolean
        {
            return this._active;
        }
        public set active(v: boolean)
        {
            this._active = v;
        }

        private _description: string;
        public get description(): string
        {
            return this._description;
        }
        public set description(v: string)
        {
            this._description = v;
        }

        private _script: string;
        public get script(): string
        {
            return this._script;
        }
        public set script(v: string)
        {
            this._script = v;
        }

        private _api_name: string;
        public get api_name(): string
        {
            return this._api_name;
        }

        private _name: string;
        public get name(): string
        {
            return this._name;
        }
        public set name(v: string)
        {
            this._name = v;
        }
    }


    // // tslint:disable-next-line:class-name
    // interface sys_metadata_json
    // {
    //     sys_class_name: string;
    //     sys_id: string;
    //     sys_policy: string;
    //     sys_updated_on: string;
    //     sys_created_on: string;
    // }
}