import { IsysRelation } from './IsysRelation';
//related serviceNow entity
export class Relation implements IsysRelation
{
    constructor(r: IsysRelation)
    {
        this.link = r.link;
        this.value = r.value;
    }
    link: string;
    value: string;
}