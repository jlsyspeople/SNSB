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

    //get update and manage workpace state.
    export class WorkspaceStateManager
    {
        //todo add get and update functions.
        constructor(context: vscode.ExtensionContext)
        {
            this._context = context;
        }
        private _context: vscode.ExtensionContext;

        /**
         * ClearState, sets all stateKeys to undefined
         */
        public ClearState()
        {
            for (const key in StateKeys)
            {
                if (StateKeys.hasOwnProperty(key))
                {
                    const element = StateKeys[key];
                    this._context.workspaceState.update(element.toString(), undefined);
                }
            }
        }

        /**
         * ClearSensitive clears sensitive data from workspace state
         */
        public ClearSensitive(): void
        {
            this._context.workspaceState.update(ServiceNow.StateKeys.password.toString(), new Object());
        }

        /**
         * HasInstanceInState
         */
        public HasInstanceInState(): boolean
        {
            if (this.GetUrl() && this.GetUserName())
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        /**
         * GetInstance get Url from state
         */
        public GetUrl(): string | undefined
        {
            return this._context.workspaceState.get(ServiceNow.StateKeys.url.toString()) as string;
        }

        /**
         * GetUserName get username from state
         */
        public GetUserName(): string | undefined
        {
            return this._context.workspaceState.get(ServiceNow.StateKeys.user.toString()) as string;
        }

        /**
         * GetPassword retrieves password from state. 
         */
        public GetPassword(): string | undefined
        {
            return this._context.workspaceState.get(ServiceNow.StateKeys.password.toString()) as string;
        }
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
         * AddScriptInclude or updates a script include
         */
        public AddScriptInclude(record: ScriptInclude, instance: Instance)
        {
            let instancePath = this.GetPathInstance(instance);

            if (instancePath)
            {
                let includedir = `${instancePath}\\ScriptInclude`;
                this.CreateFolder(includedir);

                let MetaDir = `${includedir}\\${record.name}`;
                this.CreateFolder(MetaDir);

                this.CreateFile(`${MetaDir}\\${record.name}.options.json`, JSON.stringify(record));

                this.CreateFile(`${MetaDir}\\${record.name}.script.js`, record.script);
            }
        }

        /**
         * GetScriptInclude, constructs a ScriptInclude object from workspace files
         */
        public GetScriptInclude(textDocument: vscode.TextDocument): ServiceNow.ScriptInclude | undefined
        {
            //get options
            let serialized = this.ReadTextFile(this.GetPathRecordOptions(textDocument.uri));

            let deserialized: ScriptInclude;
            if (serialized)
            {
                deserialized = new ScriptInclude(JSON.parse(serialized));

                //get script
                let script = this.ReadTextFile(this.GetPathRecordScript(textDocument.uri));

                if (script)
                {
                    deserialized.script = script;
                }
                return deserialized;
            }
        }

        private GetPathParent(Uri: vscode.Uri): string
        {
            let nameLength = this.GetFileName(Uri).length;
            return Uri.fsPath.substring(0, Uri.fsPath.length - nameLength - 1);
        }

        private GetFileName(Uri: vscode.Uri): string
        {
            let split = Uri.fsPath.split('\\');
            return split[split.length - 1];
        }

        //returns a record from textdocument.
        public GetRecord(textDocument: vscode.TextDocument): ServiceNow.Record | undefined
        {
            try
            {
                let optionsPath = this.GetPathRecordOptions(textDocument.uri);
                let content = this.ReadTextFile(optionsPath);

                if (content)
                {
                    let deserialized = JSON.parse(content);

                    return new ServiceNow.Record(deserialized);
                }
            }
            catch (e)
            {
                console.error(e);
            }
        }

        private GetPathRecordScript(uri: vscode.Uri): string
        {
            let parentPath = this.GetPathParent(uri);

            let recordName = this.GetFileName(uri);

            return `${parentPath}\\${recordName.split('.')[0]}.script.js`;
        }

        //returns the path of hte option.json that should reside in same dir. 
        private GetPathRecordOptions(uri: vscode.Uri): string
        {
            let parentPath = this.GetPathParent(uri);

            let recordName = this.GetFileName(uri);

            return `${parentPath}\\${recordName.split('.')[0]}.options.json`;
        }

        //read text files
        private ReadTextFile(path: string, encoding: string = "utf8"): string | undefined
        {
            try
            {
                let content = fileSystem.readFileSync(path, "utf8");
                return content;
            }
            catch (e)
            {
                console.error(e);
            }
        }

        private GetPathInstance(i: Instance): string | undefined
        {
            let workspaceRoot = this.GetPathWorkspace();

            if (workspaceRoot && i.Url)
            {
                let path = `${workspaceRoot.uri.fsPath}\\${i.Url.host}`;
                return path;
            }
        }

        private GetPathWorkspace(): vscode.WorkspaceFolder | undefined
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
                console.warn(`Folder Already Exist: ${path}`);
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
                console.warn(`File Already Exist: ${path}`);
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
        //optimize performance
        //todo load available records on connect.
        constructor(Url?: URL, UserName?: string, Password?: string)
        {
            if (Url && UserName && Password)
            {
                this.Initialize(Url, UserName, Password);
            }
        }


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

        private _ApiProxy: ServiceNow.Api | undefined;
        public get ApiProxy(): ServiceNow.Api | undefined
        {
            if (this.IsInitialized())
            {
                return this._ApiProxy;
            }
        }
        public set ApiProxy(v: ServiceNow.Api | undefined)
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
        public Initialize(Url: URL, UserName: string, Password: string): void
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
                if (this.ApiProxy)
                {
                    var availableIncludes = this.ApiProxy.GetScriptIncludes();

                    if (availableIncludes)
                    {
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
                    }
                }
            });
        }

        /**
         * SetScriptInclude
         * Saves script include to current instance
         * returns an update script include object on resolve. 
         * Returns an error object on reject.
         */
        public SaveScriptInclude(scriptInclude: ServiceNow.ScriptInclude): Promise<ScriptInclude>
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
                                //todo this timesout for some reason
                                let si = new ServiceNow.ScriptInclude(res.data.result);
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

    export class Api
    {
        private _SNApiEndpoint = "/api";
        private _SNTableSuffix: string = "/now/table";
        private _SNUserTable: string = `${this._SNTableSuffix}/sys_user`;
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
         * GetScriptIncludes lists all available script includes
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
         * PatchScriptInclude
         */
        public PatchScriptInclude(scriptInclude: ServiceNow.ScriptInclude): Axios.AxiosPromise | undefined
        {
            if (this.HttpClient)
            {
                //api/now/table/sys_script_include/e0085ebbdb171780e1b873dcaf96197e
                let url = `${this._SNScriptIncludeTable}/${scriptInclude.sys_id}`;
                //trim data to speed up patch
                let p = this.HttpClient.patch<ServiceNow.ScriptInclude>(url, {
                    "script": scriptInclude.script
                });
                return p;
            }
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

        /**
         * toJSON
         */
        public toJSON()
        {
            return {
                link: this._link,
                display_value: this._display_value
            };
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
    export class Record implements IsysRecord
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

        /**
         * toJSON
         */
        public toJSON()
        {
            return {
                sys_class_name: this._sys_class_name,
                sys_id: this._sys_id,
                sys_policy: this._sys_policy,
                sys_updated_on: this._sys_updated_on,
                sys_created_on: this._sys_created_on,
                sys_package: this._sys_package,
                sys_scope: this._sys_scope
            };
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

    export class ScriptInclude extends Record implements IsysScriptInclude, vscode.QuickPickItem
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
                client_callable: this._client_callable,
                access: this._access,
                active: this._active,
                description: this._description,
                script: this._script,
                api_name: this._api_name,
                name: this._name
            };
        }
    }
}