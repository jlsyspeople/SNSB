declare class GlideRecord
{
    /**Creates an instance of the GlideRecord class for the specified table. */
    constructor(tableName: string);
    /**
     * Adds a filter to return active records.
     */
    addActiveQuery(): GlideQueryCondition;
    /**
     * Adds an encoded query to other queries that may have been set.
    */
    addEncodedQuery(query: string): void;
    /**Adds a filter to return records based on a relationship in a related table. */
    addJoinQuery(joinTable: string, primaryField: object, joinTableField: object): GlideQueryCondition
    /**A filter that specifies records where the value of the field passed in the parameter is not null. */
    addNotNullQuery(fieldName: string): GlideQueryCondition;
    /**Adds a filter to return records where the value of the specified field is null. */
    addNullQuery(fieldName: string): GlideQueryCondition;
    /**Provides the ability to build a request, which when executed, returns the rows from the specified table, that match the request. */
    addQuery(fieldName: string, operator: string, value: object): GlideQueryCondition;
    /**Provides the ability to build a request, which when executed, returns the rows from the specified table, that match the request. */
    addQuery(fieldName: string, value: object): GlideQueryCondition;
    /**Provides the ability to build a request, which when executed, returns the rows from the specified table, that match the request. */
    addQuery(fieldName: string): GlideQueryCondition;
    /**Determines if the Access Control Rules, which include the user's roles, permit inserting new records in this table. */
    canCreate(): boolean;
    /**Determines if the Access Control Rules, which include the user's roles, permit deleting records in this table. */
    canDelete(): boolean;
    /**Determines if the Access Control Rules, which include the user's roles, permit reading records in this table. */
    canRead(): boolean;
    /**Determines if the Access Control Rules, which include the user's roles, permit editing records in this table. */
    canWrite(): boolean;
    /**Determines if the Access Control Rules, which include the user's roles, permit editing records in this table. */
    chooseWindow(firstRow: number, lastRow: number, forceCount: boolean): void;
    /**Returns the number of milliseconds since January 1, 1970, 00:00:00 GMT for a duration field.
     * Does not require the creation of a GlideDateTime object because the duration field is already a GlideDateTime object. */
    dateNumericValue(): number;
    /**Deletes multiple records that satisfy the query condition.
     * This method does not delete attachments. */
    deleteMultiple(): void;
    /**Deletes the current record. */
    deleteRecord(): void;
    /**Defines a GlideRecord based on the specified expression of 'name = value'.
     * This method is expected to be used to query for single records, so a 'next' operation on the recordset is performed by this method before returning. */
    get(name: object, value: object): boolean;
    /**Returns the dictionary attributes for the specified field. */
    getAttribute(fieldName: string): boolean;
    /**Returns the table's label. */
    getClassDisplayValue(): string;
    /**Returns the element's descriptor. */
    getED(): GlideElementDescriptor;
    /**Retrieves the GlideElement object for the specified field. */
    getElement(columnName: string): GlideElement;
    /**Retrieves the query condition of the current result set as an encoded query string. */
    getEncodedQuery(): string;
    /**Returns the field's label.*/
    getLabel(): string;
    /**Retrieves the last error message. If there is no last error message, null is returned. */
    getLastErrorMessage(): string;
    /**Retrieves a link to the current record. */
    getLink(noStack: boolean): string;
    /**Retrieves the class name for the current record. */
    getRecordClassName(): string;
    /**Retrieves the number of rows in the query result. */
    getRowCount(): number;
    /**Retrieves the name of the table associated with the GlideRecord. */
    getTableName(): string;
    /**Gets the primary key of the record, which is usually the sys_id unless otherwise specified. */
    getUniqueValue(): string;
    /**Retrieves the string value of an underlying element in a field. */
    getValue(name: string): string;
    /**Determines if there are any more records in the GlideRecord object. */
    hasNext(): boolean;
    /**Creates an empty record suitable for population before an insert. */
    initialize(): void;
    /**Inserts a new record using the field values that have been set for the current record.
     */
    insert(): string
    /**Checks to see if the current database action is to be aborted.*/
    isActionAborted(): boolean;
    /**Checks if the current record is a new record that has not yet been inserted into the database. */
    isNewRecord(): boolean;
    /**Determines if the table exists. */
    isValid(): boolean;
    /**Determines if the specified field is defined in the current table. */
    isValidField(columnName: string): boolean;
    /**Determines if current record is a valid record. */
    isValidRecord(): boolean;
    /**Creates a new GlideRecord record, sets the default values for the fields, and assigns a unique ID to the record. */
    newRecord(): boolean;
    /**Moves to the next record in the GlideRecord object. */
    next(): boolean;
    /**Retrieves the current operation being performed, such as insert, update, or delete. */
    operation(): string;
    /**Specifies an orderBy column.
     * Call this method more than once to order by multiple columns. Results are arranged in ascending order, see orderByDesc(String name) to arrange records in descending order. */
    orderBy(name: string): void;
    /**Specifies a decending orderBy column. */
    orderByDesc(name: string): void;

    /**Runs the query against the table based on the filters specified by addQuery, addEncodedQuery, etc. */
    query(): void;
    /**Runs the query against the table based on the filters specified by addQuery, addEncodedQuery, etc.
     * If name/value pair is specified, "name=value" condition is added to the query.
     */
    query(field: object, value: object): void;
    /**Sets a flag to indicate if the next database action (insert, update, delete) is to be aborted. This is often used in business rules.
     * Use in an onBefore business rule to prevent the database action from being done.
     * The business rule continues to run after setAbortAction() is called. Calling setAbortAction() does not stop subsequent business rules from executing.
     * Calling this method only prevents the database action from occurring. */
    setAbortAction(b: boolean): void;
    /**Sets the duration field to a number of milliseconds since January 1, 1970, 00:00:00 GMT for a duration field.
     * Does not require the creation of a GlideDateTime object because the duration field is already a GlideDateTime object. */
    setDateNumericValue(milliseconds: number): void;
    /**Sets the limit for number of records are fetched by the GlideRecord query. */
    setLimit(maxNumRecords: number): void;
    /**Sets sys_id value for the current record. */
    setNewGuidValue(guid: string): void;

    /**Sets the value of the field with the specified name to the specified value.
     * Normally the script does a gr.category = value. However, if the element name is itself a variable then gr.setValue(elementName, value) can be used.*/
    setValue(name: string, value: object): void;
    /**Enables or disables the running of business rules, script engines, and audit.
     * 
     * @param enable If true (default), enables business rules. If false, disables business rules.
     */
    setWorkflow(enable: boolean): void;
    /**Updates the GlideRecord with any changes that have been made. If the record does not already exist, it is inserted.
     * 
     * @param reason The reason for the update. The reason is displayed in the audit record.
     * @returns Unique ID of the new or updated record. Returns null if the update fails.
     */
    update(reason: string): string

    /**
     * Updates each GlideRecord in the list with any changes that have been made.
     * 
     * When changing field values, use **setValue()** instead of directly setting the field (field = something).
     * 
     * When using updateMultiple(), directly setting the field (gr. state = 4) results in all records in the table being updated instead of just the records returned by the query.
     * 
     * **Do not** use this method with the chooseWindow() or setLimit() methods when working with large tables.
     */
    updateMultiple(): void

    /**Provides the same functionality as next(), it is intended to be used in cases where the GlideRecord has a column named next. */
    _next(): boolean;

    /**Identical to query(). This method is intended to be used on tables where there is a column named query, which would interfere with using the query() method.*/
    _query(): void;
}

declare class GlideElement
{
    /** The Scoped GlideElement API provides a number of convenient script methods for dealing with fields and their values. Scoped GlideElement methods are available for the fields of the current GlideRecord.
     * **Not fully Documented**
     */
    constructor();
}

declare class GlideElementDescriptor
{
    /**
     * There is no constructor for this class.
     * Use the GlideElement getED() method to obtain a GlideElementDescriptor object.
     */
    constructor();
    /**Returns the encryption type used for attachments on the element's table. 
     * This method is for use with the Edge Encryption plugin. */
    getAttachmentEncryptionType(): string;
    /**Returns the element's encryption type.
     * This method is for use with the Edge Encryption plugin. */
    getEncryptionType(): string;
    /**Returns the element's internal data type. */
    getInternalType(): string;
    /**Returns the element's label.*/
    getLabel(): string;
    /**Returns the element's length. */
    getLength(): number;
    /**Returns the element's name. */
    getName(): string;
    /**Returns the element's plural label. */
    getPlural(): String
    /**Returns true if an encrypted attachment has been added to the table.
     * This method is for use with the Edge Encryption plugin. */
    hasAttachmentsEncrypted(): Boolean;
    /**Returns true if the element is an automatically generated or system field.
     * Automatically generated and system fields cannot be encrypted. This method is for use with the Edge Encryption plugin. */
    isAutoOrSysID(): boolean;
    /**Returns true if an element is encrypted.
     * This method is for use with the Edge Encryption plugin. */
    isEdgeEncrypted(): boolean;
    /**Returns true if the element is a virtual element.
     * A virtual element is a calculated field as set by the dictionary definition of the field. Virtual fields cannot be encrypted. */
    isVirtual(): boolean;

}

declare class GlideQueryCondition
{
    /**This class has no constructor.
     * A GlideQueryCondition object is returned by the following methods:
     * * addActiveQuery()
     * * addInactiveQuery()
     * * addJoinQuery()
     * * addNotNullQuery()
     * * addNullQuery()
     * * addQuery()
     */
    constructor();
    /**Adds an AND condition to the current condition. */
    addCondition(name: string, operation: string, value: object): GlideQueryCondition;
    /**Appends a 2-or-3 parameter OR condition to an existing GlideQueryCondition. */
    addOrCondition(name: string, operation: string, value: object): GlideQueryCondition;
}