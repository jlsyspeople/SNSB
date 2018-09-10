# SNSB
ServiceNow Scripting Bridge.
the Vs Code Extension extension that allows you to develop against the ServiceNow platform.

No ServiceNow configuration required.

NB: Only Basic auth is available. 



# Features

* Work with Script Includes and widgets
* Saves to ServiceNow on FileSave
* On file open latest is downloaded from ServiceNow


# Try it
the only way to currenty try the extension is to compile from the source.

You need to have [Node.js](https://nodejs.org/en/) installed.


1. Clone and open repository
2. rebuild module dependencies using command "npm install" (make sure you are located in the workspace root)
3. start debugger
4. when debugging open a workspace
5. invoke command: Connect to ServiceNow

# Additional Extensions
Extensions that go very well with this extension

* [IntelliSense for CSS class names in HTML](https://marketplace.visualstudio.com/items?itemName=Zignd.html-css-class-completion) - for proper css intellisense i HTML. 


## Available commands
### Connect to ServiceNow
prompts for url, username and password.

if the workspace is already associated with a ServiceNow instance only the password is required.

**NB: only Basic auth is supported**

### Add Script Include To Workspace
Imports a script include into the workspace for edit.

Read only and restricted script includes is not available.

### Add Widget to Workspace
imports a widget into the the workspace.

Read only and restricted widgets is not available.

### Add Theme to Workspace
imports a theme into the workspace

Read only and restricted themes is not available.

### Clear Instance
clear workspace data. eg. cached records, urls, username.

make sure to reconnect to service and refresh records or reload vscode.

### Refresh Records
rebuilds caches records. 

if you missing a script in the list when trying to load one use this command to retreive all from instance.
