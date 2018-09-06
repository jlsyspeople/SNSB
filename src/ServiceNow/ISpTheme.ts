import { ISysMetadata } from "./ISysMetadata";
import { IRelation } from "./IRelation";

export interface ISpTheme extends ISysMetadata
{
    css_variables: string;
    name: string;
    navbar_fixed: Boolean;
    footer_fixed: boolean;
    footer: string;
    header: IRelation;
}
