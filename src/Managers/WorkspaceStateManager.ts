import * as vscode from 'vscode';
import { StateKeys } from "./StateKeys";
import { ScriptInclude } from "../ServiceNow/all";

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
        this._context.workspaceState.update(StateKeys.password.toString(), new Object());
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
     * SetUrl
     */
    public SetUrl(url: string): void
    {
        this._context.workspaceState.update(StateKeys.url.toString(), url);
    }

    /**
     * GetInstance get Url from state
     */
    public GetUrl(): string | undefined
    {
        return this._context.workspaceState.get(StateKeys.url.toString()) as string;
    }

    /**
     * SetUserName
     */
    public SetUserName(url: string): void
    {
        this._context.workspaceState.update(StateKeys.user.toString(), url);
    }

    /**
     * GetUserName get username from state
     */
    public GetUserName(): string | undefined
    {
        return this._context.workspaceState.get(StateKeys.user.toString()) as string;
    }

    /**
     * SetScriptIncludes
     * Cache scriptIncludes in local storage
     * overwrites existing
     */
    public SetScriptIncludes(scriptInlcudes: Array<ScriptInclude>): void
    {
        this._context.workspaceState.update(StateKeys.scriptIncludes.toString(), scriptInlcudes);
    }

    /**
     * GetScriptIncludes
     */
    public GetScriptIncludes(): Array<ScriptInclude> | undefined
    {
        return this._context.workspaceState.get(StateKeys.scriptIncludes.toString());
    }

}