# SNSB
ServiceNow Scripting Bridge.
the Vs Code Extension extension that allows you to develop against the ServiceNow platform.

No ServiceNow configuration required.

NB: Only Basic auth is available. 

# Features

* Work with Script Includes in you favourite IDE
* Save to ServiceNow on FileSave
* On file open latest is downloaded from ServiceNow


# Try it
the only way to currenty try the extension is to compile from the source.

You need to have [Node.js](https://nodejs.org/en/) installed.



1. Clone and open repository
2. rebuild module dependencies using command "npm install" (make sure you are located in the workspace root)
3. start debugger
4. when debugging open a workspace
5. invoke command: Connect to ServiceNow


## Available commands
### Connect to ServiceNow
prompts for url, username and password.

if the workspace is already associated with a ServiceNow instance only the password is required.

**NB: only Basic auth is supported**

### Load Script Include
Imports a script include into the workspace for edit.

Read only and restricted script includes is available.

### Clear Instance
clear workspace data. eg. cached records, urls, username.

make sure to reconnect to service and refresh records or reload vscode.

### Refresh Records
rebuilds caches records. 

if you missing a script in the list when trying to load one use this command to retreive all from instance.
