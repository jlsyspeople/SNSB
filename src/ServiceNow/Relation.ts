import {IsysRelation} from './IsysRelation';
//related serviceNow entity
export class Relation implements IsysRelation
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