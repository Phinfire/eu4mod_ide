import { AbstractLocalisationUser } from "./localisation/AbstractLocalisationUser";

export interface IHasLocalisableName {
    getName(localisationUser: AbstractLocalisationUser) : string;
}