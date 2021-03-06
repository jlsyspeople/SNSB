import * as fileSystem from 'fs';
import * as vscode from 'vscode';
import * as ServiceNow from '../ServiceNow/all';
import { IsysRecord } from '../ServiceNow/all';

export class WorkspaceManager
{

    constructor(context: vscode.ExtensionContext)
    {
        this.SetDelimiter(context);
    }

    private _delimiter: string | undefined;
    private SetDelimiter(context: vscode.ExtensionContext)
    {
        let storagePath = context.storagePath;

        if (storagePath)
        {
            if (storagePath.includes("/"))
            {
                this._delimiter = "/";
            }
            else
            {
                this._delimiter = "\\";
            }
        }
    }

    /**
     * Addinstance Creates the base folder structure in workspace.
     */
    public AddInstanceFolder(i: ServiceNow.Instance): void
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
     * AddWidget
     */
    public AddWidget(record: ServiceNow.Widget, instance: ServiceNow.Instance): void
    {
        let instancePath = this.GetPathInstance(instance);

        if (instancePath)
        {
            let widgetDir = this.GetPathWidget(instance);
            this.CreateFolder(widgetDir);

            let MetaDir = `${widgetDir}${this._delimiter}${record.name}`;
            this.CreateFolder(MetaDir);

            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.options.json`, this.GetOptionsPretty(record));

            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.client_script.js`, record.client_script);
            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.server_script.js`, record.script);
            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.css`, record.css);
            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.html`, record.template);
        }
    }

    /**
     * UpdateWidget
     */
    public UpdateWidget(record: ServiceNow.Widget, textDocument: vscode.TextDocument): void
    {
        this.OverwriteFile(`${this.GetPathRecordOptions(textDocument.uri)}`, this.GetOptionsPretty(record));
        this.OverwriteFile(`${this.GetPathRecordScript(textDocument.uri)}`, record.script);
        this.OverwriteFile(`${this.GetPathRecordClientScript(textDocument.uri)}`, record.client_script);
        this.OverwriteFile(`${this.GetPathRecordHtmlTemplate(textDocument.uri)}`, record.template);

        console.info(`${record.name} have been saved to workspace`);
    }

    /**
     * GetWidget
     */
    public GetWidget(textDocument: vscode.TextDocument): ServiceNow.Widget | undefined
    {
        //get options
        let serialized = this.ReadTextFile(this.GetPathRecordOptions(textDocument.uri));

        let deserialized: ServiceNow.Widget;
        if (serialized)
        {
            deserialized = new ServiceNow.Widget(JSON.parse(serialized));

            //get script
            let script = this.ReadTextFile(this.GetPathRecordScript(textDocument.uri));
            let clientScript = this.ReadTextFile(this.GetPathRecordClientScript(textDocument.uri));
            let css = this.ReadTextFile(this.GetPathRecordCss(textDocument.uri));
            let html = this.ReadTextFile(this.GetPathRecordHtmlTemplate(textDocument.uri));

            if (script && clientScript && css && html)
            {
                deserialized.script = script;
                deserialized.client_script = clientScript;
                deserialized.css = css;
                deserialized.template = html;
            }
            return deserialized;
        }
    }

    /**
     * AddScriptInclude, adds a new script include to the workspace
     */
    public AddScriptInclude(record: ServiceNow.ScriptInclude, instance: ServiceNow.Instance): void
    {
        let instancePath = this.GetPathInstance(instance);

        if (instancePath)
        {
            let includedir = this.GetPathScriptInclude(instance);
            this.CreateFolder(includedir);

            let MetaDir = `${includedir}${this._delimiter}${record.name}`;
            this.CreateFolder(MetaDir);

            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.options.json`, this.GetOptionsPretty(record));

            this.CreateFile(`${MetaDir}${this._delimiter}${record.name}.server_script.js`, record.script);
        }
    }

    /**
     * UpdateScriptInclude, updates a script include that have already been added.
     */
    public UpdateScriptInclude(record: ServiceNow.ScriptInclude, textDocument: vscode.TextDocument): void
    {
        this.OverwriteFile(`${this.GetPathRecordOptions(textDocument.uri)}`, this.GetOptionsPretty(record));
        this.OverwriteFile(`${this.GetPathRecordScript(textDocument.uri)}`, record.script);

        console.info(`${record.name} have been saved to workspace`);
    }

    /**
     * GetScriptInclude, constructs a ScriptInclude object from workspace files
     */
    public GetScriptInclude(textDocument: vscode.TextDocument): ServiceNow.ScriptInclude | undefined
    {
        //get options
        let serialized = this.ReadTextFile(this.GetPathRecordOptions(textDocument.uri));

        let deserialized: ServiceNow.ScriptInclude;
        if (serialized)
        {
            deserialized = new ServiceNow.ScriptInclude(JSON.parse(serialized));

            //get script
            let script = this.ReadTextFile(this.GetPathRecordScript(textDocument.uri));

            if (script)
            {
                deserialized.script = script;
            }
            return deserialized;
        }
    }

    private GetOptionsPretty(record: IsysRecord): string
    {
        return JSON.stringify(record, null, 2);
    }

    private GetPathInstance(i: ServiceNow.Instance): string | undefined
    {
        let workspaceRoot = this.GetPathWorkspace();

        if (workspaceRoot && i.Url)
        {
            let path = `${workspaceRoot.uri.fsPath}${this._delimiter}${i.Url.host}`;
            return path;
        }
    }

    private GetPathScriptInclude(instanse: ServiceNow.Instance): string
    {
        let p = this.GetPathInstance(instanse);
        return `${p}${this._delimiter}ScriptInclude`;
    }

    private GetPathWidget(instanse: ServiceNow.Instance): string
    {
        let p = this.GetPathInstance(instanse);
        return `${p}${this._delimiter}Widget`;
    }

    private GetPathParent(Uri: vscode.Uri): string
    {
        let nameLength = this.GetFileName(Uri).length;
        return Uri.fsPath.substring(0, Uri.fsPath.length - nameLength - 1);
    }

    private GetFileName(Uri: vscode.Uri): string
    {
        let split = Uri.fsPath.split(`${this._delimiter}`);
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

        return `${parentPath}${this._delimiter}${recordName.split('.')[0]}.server_script.js`;
    }

    private GetPathRecordClientScript(uri: vscode.Uri): string
    {
        let parentPath = this.GetPathParent(uri);

        let recordName = this.GetFileName(uri);

        return `${parentPath}${this._delimiter}${recordName.split('.')[0]}.client_script.js`;
    }

    //returns the path of hte option.json that should reside in same dir. 
    private GetPathRecordOptions(uri: vscode.Uri): string
    {
        let parentPath = this.GetPathParent(uri);

        let recordName = this.GetFileName(uri);

        return `${parentPath}${this._delimiter}${recordName.split('.')[0]}.options.json`;
    }

    GetPathRecordCss(uri: vscode.Uri): string
    {
        let parentPath = this.GetPathParent(uri);

        let recordName = this.GetFileName(uri);

        return `${parentPath}${this._delimiter}${recordName.split('.')[0]}.css`;
    }

    GetPathRecordHtmlTemplate(uri: vscode.Uri): string
    {
        let parentPath = this.GetPathParent(uri);

        let recordName = this.GetFileName(uri);

        return `${parentPath}${this._delimiter}${recordName.split('.')[0]}.html`;
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

    private OverwriteFile(path: string, value: string): void
    {
        if (this.FileExist(path))
        {
            this.WriteFile(path, "");
            this.WriteFile(path, value);
        }
        else
        {
            console.warn(`File not found: ${path}`);
        }
    }

    private CreateFile(path: string, value: string): void
    {
        if (!this.FileExist(path))
        {
            this.WriteFile(path, value);
        }
    }

    private WriteFile(path: string, value: string): void
    {
        try
        {
            fileSystem.writeFile(path, value, 'utf8', (err) => { console.error(err.message); });
        }
        catch (e)
        {
            console.error(e);
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