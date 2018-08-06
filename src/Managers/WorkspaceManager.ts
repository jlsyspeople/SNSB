import * as fileSystem from 'fs';
import * as vscode from 'vscode';
import * as ServiceNow from '../ServiceNow/all';
import { IsysRecord } from '../ServiceNow/all';

export class WorkspaceManager
{
    constructor()
    {
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
     * AddScriptInclude, adds a new script include to the workspace
     */
    public AddScriptInclude(record: ServiceNow.ScriptInclude, instance: ServiceNow.Instance)
    {
        let instancePath = this.GetPathInstance(instance);

        if (instancePath)
        {
            let includedir = this.GetPathScriptInclude(instance);
            this.CreateFolder(includedir);

            let MetaDir = `${includedir}\\${record.name}`;
            this.CreateFolder(MetaDir);

            this.CreateFile(`${MetaDir}\\${record.name}.options.json`, this.GetOptionsPretty(record));

            this.CreateFile(`${MetaDir}\\${record.name}.script.js`, record.script);
        }
    }

    /**
     * UpdateScriptInclude, updates a script include that have already been added.
     */
    public UpdateScriptInclude(record: ServiceNow.ScriptInclude, textDocument: vscode.TextDocument)
    {
        this.OverwriteFile(`${this.GetPathRecordOptions(textDocument.uri)}`, this.GetOptionsPretty(record));
        this.OverwriteFile(`${this.GetPathRecordScript(textDocument.uri)}`, record.script);

        vscode.window.showInformationMessage(`${record.name} have been updated`);
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

    private GetPathScriptInclude(instanse: ServiceNow.Instance): string
    {
        let p = this.GetPathInstance(instanse);
        return `${p}\\ScriptInclude`;
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

    private GetPathInstance(i: ServiceNow.Instance): string | undefined
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