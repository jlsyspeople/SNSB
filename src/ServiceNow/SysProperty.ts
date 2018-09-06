import { IsysProperty } from "./ISysProperty";
import { Record } from "./Record";

export class SysProperty extends Record implements IsysProperty
{
    constructor(p: IsysProperty)
    {
        super(p);
        this.name = p.name;
        this.value = p.value;
        this.type = p.type;

    }
    name: string;
    value: string;
    type: boolean;
}