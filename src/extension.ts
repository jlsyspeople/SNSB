'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { URL } from 'url';
import * as ServiceNow from './ServiceNow/all';
import * as Managers from './Managers/all';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{

    const wm = new Managers.WorkspaceManager();
    const wsm = new Managers.WorkspaceStateManager(context);

    let instance: ServiceNow.Instance;
    if (wsm.HasInstanceInState)
    {
        instance = new ServiceNow.Instance();
    }

    //no need for reinstatiation on each call. would also make it easier to store already retrieved entites. 
    console.info("SNSB Plugin Activated");

    //Configure instance object
    //todo prober error message on access denied
    //todo refactor? this looks way to fat
    let connect = vscode.commands.registerCommand('snsb.connect', () =>
    {
        let option = new Object() as vscode.InputBoxOptions;

        if (wsm.HasInstanceInState())
        {
            option.prompt = "Enter Password";
            let promisePassword = vscode.window.showInputBox(option);

            promisePassword.then((res) =>
            {
                if (res !== undefined)
                {
                    let url = wsm.GetUrl();
                    let usr = wsm.GetUserName();
                    if (url && usr)
                    {
                        instance.Initialize(new URL(url), usr, res, wsm);
                    }
                }
            });
        }
        else
        {
            option.prompt = "Service Now instance Url";
            let PromiseUrl = vscode.window.showInputBox(option);

            PromiseUrl.then((res) =>
            {
                if (res !== undefined)
                {
                    wsm.SetUrl(res);

                    option.prompt = "Enter User Name";
                    let PromiseUserName = vscode.window.showInputBox(option);

                    PromiseUserName.then((res) =>
                    {
                        if (res !== undefined)
                        {
                            wsm.SetUserName(res);

                            option.prompt = "Enter Password";
                            let PromisePassword = vscode.window.showInputBox(option);

                            PromisePassword.then((res) =>
                            {
                                if (res !== undefined)
                                {
                                    try
                                    {
                                        let usr = wsm.GetUserName();
                                        let url = wsm.GetUrl();
                                        let pw = res;

                                        if (url !== undefined)
                                        {
                                            instance = new ServiceNow.Instance(new URL(url), usr, pw, wsm);
                                            wm.AddInstanceFolder(instance);
                                        }

                                    } catch (error)
                                    {
                                        wsm.ClearState();
                                        vscode.window.showErrorMessage(error.message);
                                        throw error;
                                    }
                                }
                            });
                        }
                    });
                }
            }, (res) => { vscode.window.showErrorMessage(res); });
        }
    });

    //todo update all command
    let GetInclude = vscode.commands.registerCommand("snsb.getInclude", () =>
    {
        // todo add loading indicator
        if (instance.IsInitialized())
        {
            console.log("loading includes");
            let includes = instance.GetScriptIncludes();
            includes.then((res) =>
            {
                vscode.window.showQuickPick(res).then((item) =>
                {
                    if (item)
                    {
                        wm.AddScriptInclude(item, instance);
                    }
                });
            });
        }
        else
        {
            vscode.window.showErrorMessage("Connect to an instance");
        }
    });

    let clearWorkState = vscode.commands.registerCommand("snsb.clearWorkSpaceState", () =>
    {
        wsm.ClearState();
    });

    let rebuildCache = vscode.commands.registerCommand("snsb.rebuildCache", () =>
    {
        instance.RebuildCache();
    });

    var listenerOnDidSave = vscode.workspace.onDidSaveTextDocument((e) =>
    {
        let record = wm.GetRecord(e);

        if (record)
        {
            switch (record.sys_class_name)
            {
                case "Script Include":
                    let include = wm.GetScriptInclude(e);
                    if (include)
                    {
                        let p = instance.SaveScriptInclude(include);
                        p.then((res) =>
                        {
                            vscode.window.showInformationMessage(`${res.name} Saved`);
                            wm.UpdateScriptInclude(res, e);
                        }).catch((e) =>
                        {
                            vscode.window.showErrorMessage(`Save Failed: ${e.error.message}`);
                        });
                    }
                    break;
                default:
                    console.warn("Record not Recognized");
                    break;
            }
        }
    });

    var listenerOnDidOpen = vscode.workspace.onDidOpenTextDocument((e) =>
    {
        var recordLocal = wm.GetRecord(e);
        if (recordLocal)
        {

            var p = instance.IsLatest(recordLocal);

            p.then((res) =>
            {
                switch (res.sys_class_name)
                {
                    case "Script Include":
                        let pr = instance.GetScriptInclude(res.sys_id);

                        pr.then((res) =>
                        {
                            wm.UpdateScriptInclude(res, e);
                        });
                        break;

                    default:
                        console.warn("Record not Recognized");
                        break;
                }
            }).catch((e) =>
            {
                console.info("local Record Up to date");
            });
        }
    });

    context.subscriptions.push(connect);
    context.subscriptions.push(GetInclude);
    context.subscriptions.push(clearWorkState);
    context.subscriptions.push(rebuildCache);
    context.subscriptions.push(listenerOnDidSave);
    context.subscriptions.push(listenerOnDidOpen);
}
// this method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext)
{
    const wsm = new Managers.WorkspaceStateManager(context);
    wsm.ClearSensitive();
}