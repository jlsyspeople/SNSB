'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { URL } from 'url';
import { ServiceNow } from './class/ServiceNow';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
    const wm = new ServiceNow.WorkspaceManager();
    //todo convert Instance to constant
    //no need for reinstatiation on each call. would also make it easier to store already retrieved entites. 


    console.info("SNSB Plugin Activated");

    //Configure instance object
    //todo prober error message on access denied
    //todo refactor? this looks way to fat
    let connect = vscode.commands.registerCommand('snsb.connect', () =>
    {
        let option = new Object() as vscode.InputBoxOptions;

        //if cached only prompt for password and reinstantiate
        let urlFromState = context.workspaceState.get(ServiceNow.StateKeys.url.toString());
        let usrFromState = context.workspaceState.get(ServiceNow.StateKeys.user.toString());

        if (urlFromState !== undefined && usrFromState !== undefined)
        {
            option.prompt = "Enter Password";
            let promisePassword = vscode.window.showInputBox(option);

            promisePassword.then((res) =>
            {
                if (res !== undefined)
                {
                    context.workspaceState.update(ServiceNow.StateKeys.password.toString(), res);
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
                    context.workspaceState.update(ServiceNow.StateKeys.url.toString(), res);

                    option.prompt = "Enter User Name";
                    let PromiseUserName = vscode.window.showInputBox(option);

                    PromiseUserName.then((res) =>
                    {
                        if (res !== undefined)
                        {
                            context.workspaceState.update(ServiceNow.StateKeys.user.toString(), res);

                            option.prompt = "Enter Password";
                            let PromisePassword = vscode.window.showInputBox(option);

                            PromisePassword.then((res) =>
                            {
                                if (res !== undefined)
                                {
                                    try
                                    {
                                        let usr = context.workspaceState.get(ServiceNow.StateKeys.user.toString()) as string;
                                        let url = context.workspaceState.get(ServiceNow.StateKeys.url.toString()) as string;
                                        let pw = res;

                                        if (url !== undefined)
                                        {
                                            let instance = new ServiceNow.Instance(new URL(url), usr, pw);
                                            wm.AddInstanceFolder(instance);

                                            context.workspaceState.update(ServiceNow.StateKeys.password.toString(), pw);
                                        }

                                    } catch (error)
                                    {
                                        context.workspaceState.update(ServiceNow.StateKeys.user.toString(), undefined);
                                        context.workspaceState.update(ServiceNow.StateKeys.url.toString(), undefined);
                                        context.workspaceState.update(ServiceNow.StateKeys.password.toString(), undefined);

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

    //todo opt for include system includes
    //todo upload on save
    //todo update all command
    let GetInclude = vscode.commands.registerCommand("snsb.getInclude", () =>
    {
        let urlFromState = context.workspaceState.get(ServiceNow.StateKeys.url.toString()) as string;
        let usrFromState = context.workspaceState.get(ServiceNow.StateKeys.user.toString()) as string;
        let pwFromState = context.workspaceState.get(ServiceNow.StateKeys.password.toString()) as string;

        if (urlFromState !== undefined && usrFromState !== undefined && pwFromState !== undefined)
        {
            let instance = new ServiceNow.Instance(new URL(urlFromState), usrFromState, pwFromState);
            let includes = instance.ListScriptIncludes();
            includes.then((res) =>
            {
                vscode.window.showQuickPick(res).then((item) =>
                {
                    if (item)
                    {
                        console.log("i got picked: " + item.label);
                        wm.AddScriptInclude(item, instance);
                    }
                });
                console.log(res.length);
            });
        }
        else
        {
            vscode.window.showErrorMessage("Connect to an instance");
        }
    });

    let clearWorkState = vscode.commands.registerCommand("snsb.clearWorkState", () =>
    {
        context.workspaceState.update(ServiceNow.StateKeys.user.toString(), undefined);
        context.workspaceState.update(ServiceNow.StateKeys.url.toString(), undefined);
        context.workspaceState.update(ServiceNow.StateKeys.password.toString(), undefined);
    });

    context.subscriptions.push(connect);
    context.subscriptions.push(GetInclude);
    context.subscriptions.push(clearWorkState);


}
// this method is called when your extension is deactivated
export function deactivate(context: vscode.ExtensionContext)
{
    //clear cached instance
    context.workspaceState.update(ServiceNow.StateKeys.password.toString(), new Object());
}