import { resolveAmbigousPointExpression, setupCoatOfArmsPolygonClipPath } from "../../utils";
import { Discord } from "../points/Discord";
import { Entry } from "../points/Entry";
import { Guesser } from "../INationGuesser";
import { Nation } from "../../model/Nation";
import { ImageSelectionTable } from "../../ui/ImageSelectionTable";
import { Game } from "../../model/Game";
import { ILocalisationProvider } from "../../model/localisation/ILocalizationProvider";
import { AbstractLocalisationUser } from "../../model/localisation/AbstractLocalisationUser";
import { INation } from "../../model/INation";
import { ColonialRegion } from "../../model/ColonialRegion";
import { DiscordUser } from "../points/DiscordUser";
import { WebSocketWrapper } from "../WebsocketWrapper";
import { OverrideNation } from "../../model/OverrideNation";

const DEFAULT_POINTS = 1;

enum MessageType {
    CHECKIN = "checkin", // send credentials, should never be received
    CHANGE_ENTRY = "change",
    ADD_ENTRY = "add",
    REMOVE_ENTRY = "remove",

    REQUESTING_DATA = "requestData",
    DATA_DELIVERY = "sendData"
}

export class AlliancePoints {

    private comparator  = (a: Entry, b: Entry) => b.getPoints() - a.getPoints();
    private perColComparator = new Map<HTMLDivElement, ((e1: Entry, e2: Entry) => number)>();
    private filterDirection = 1;
    private main: HTMLDivElement;
    private locUser: AbstractLocalisationUser;
    private entries: Entry[] = [];

    private pw: string = "dev";
    private lobbyID: string = "dev";
    private myID: string;
    private cachedDiscordUsers: Map<string, DiscordUser> = new Map();
    private cachedNationTable: ImageSelectionTable<Nation> | null = null;

    constructor(socketUrl: string, private locProvider: ILocalisationProvider, private nationGuesser: Guesser, private game: Game) {
        this.myID = performance.now().toString()  + Math.random().toString();
        this.locUser = new class extends AbstractLocalisationUser  {
        };
        this.locUser.setLocalisationProvider(locProvider);
        this.main = document.createElement('div');
        const apThis = this;
        const ws = new WebSocket(socketUrl);
        const wsWrapper = new WebSocketWrapper(null, (wsWrapper: WebSocketWrapper) => {
            wsWrapper.sendMessage(JSON.stringify({type: MessageType.CHECKIN, lobbyID: apThis.lobbyID, pw: apThis.pw}));
            apThis.setupUI(wsWrapper);
        });
    }

    private setupUI(ws: WebSocketWrapper) {
        const thisAp = this;
        const wrapper = document.getElementsByClassName('app-wrapper')[0];
        wrapper.innerHTML = "";
        const pointsWrapper = document.createElement('div');
        const tableHeader = document.createElement('div');
        const headerheader = document.createElement('div');
        headerheader.classList.add("points-table-top");

        const importFromDiscord = document.createElement("div");	
        importFromDiscord.textContent = "🡓DC";
        headerheader.appendChild(importFromDiscord);
        const askServerForData = document.createElement("div");
        askServerForData.textContent = "🡓"
        headerheader.appendChild(askServerForData);

        const addEntryButton = document.createElement("div");
        addEntryButton.textContent = "➕";
        headerheader.appendChild(addEntryButton);

        const addColonialEntryButton = document.createElement("div");
        addColonialEntryButton.textContent = "➕🏝️";
        headerheader.appendChild(addColonialEntryButton);

        const exportToClipboard = document.createElement("div");
        exportToClipboard.textContent = "🡑📋"
        headerheader.appendChild(exportToClipboard);

        tableHeader.appendChild(headerheader);
        tableHeader.classList.add("points-table-header");
        pointsWrapper.appendChild(tableHeader);
        const headerRow = this.buildRowStructure(true);
        this.perColComparator.set(headerRow.pointsPanel, (e1, e2) => e1.getPoints() - e2.getPoints());
        this.perColComparator.set(headerRow.namePanel, (e1, e2) => e1.getNation().getName(this.locUser).localeCompare(e2.getNation().getName(this.locUser)));
        this.perColComparator.set(headerRow.playerPanel, (e1, e2) => e1.getPlayer().getName().localeCompare(e2.getPlayer().getName()));
        tableHeader.appendChild(headerRow.row);
        wrapper.appendChild(pointsWrapper);
        this.main.classList.add("points-table");
        pointsWrapper.appendChild(this.main);
        importFromDiscord.onclick = function() {
            thisAp.reImportFromDiscord().then((importedEntries) => {
                const sorted = importedEntries.sort((a, b) => a.getNation().getName(thisAp.locUser).localeCompare(b.getNation().getName(thisAp.locUser)));
                thisAp.populateTable(ws, sorted, thisAp.main, headerRow);
            });
        };
        exportToClipboard.onclick = function() {
            thisAp.exportToClipboard();
        };
        addEntryButton.onclick = function() {
            const newEntry = new Entry(DEFAULT_POINTS, OverrideNation.fabricateDummyNation("???", thisAp.game), new Discord().getNewNoUserUser());
            const newEntries = thisAp.entries.concat([newEntry]);
            thisAp.populateTable(ws, newEntries, thisAp.main, headerRow);
        };
        addColonialEntryButton.onclick = function() {
            
        };
        ws.setOnMessage(event =>  {
            const data = JSON.parse(event.data);
            if (data.type == MessageType.CHANGE_ENTRY) { // TODO: implement all possible changes
                const entryCore = data.entry;
                const matchingLocalEntry = thisAp.entries.find(e => e.getId() == entryCore.id);
                if (matchingLocalEntry) {
                    matchingLocalEntry.setPoints(entryCore.points);
                    const nation = thisAp.game.getNationByTag(entryCore.nation);
                    if (nation) {
                        matchingLocalEntry.setNation(nation);
                    } else {
                        throw new Error("Could not find nation for tag " + entryCore.nation);
                    }
                } else {
                    throw new Error("Could not find entry for id " + entryCore.id);
                }
            } else if (data.type == MessageType.DATA_DELIVERY) {
                const packedEntries = data.entries;
                packedEntries.forEach((entryCore: any) => {
                    const unpackedEntries: Entry[] = [];
                    thisAp.unpackEntry(entryCore).then((newEntry) => {
                        unpackedEntries.push(newEntry);
                    });
                    return Promise.all(unpackedEntries);
                }).then((arg: Entry[]) => {
                    thisAp.populateTable(ws, arg, thisAp.main, headerRow);
                });
            } else if (data.type == MessageType.REQUESTING_DATA) {
                ws.sendMessage(JSON.stringify({type: MessageType.DATA_DELIVERY, sourceId: thisAp.myID, entries: thisAp.entries.map(e => e.toSendable())}));
            } else if (data.type == MessageType.ADD_ENTRY) {
                thisAp.unpackEntry(data.entry).then((newEntry) => {
                    thisAp.populateTable(ws, thisAp.entries.concat([newEntry]), thisAp.main, headerRow);
                });
            } else if (data.type == MessageType.REMOVE_ENTRY) {
                const newEntries = thisAp.entries.filter(e => e.getId() != data.id);
                thisAp.populateTable(ws, newEntries, thisAp.main, headerRow);
            }
        });
    }

    private async unpackEntry(entryCore: any): Promise<Entry> {
        const nation = this.game.getNationByTag(entryCore.nation);
        if (nation == null) {
            throw new Error("Could not find nation for tag " + entryCore.nation);
        }
        if (this.cachedDiscordUsers.size == 0) {
            await this.reImportFromDiscord();
        }
        const player = this.cachedDiscordUsers.get(entryCore.player);
        if (player == null) {
            throw new Error("Could not find player for id " + entryCore.player);
        }
        const newEntry = new Entry(entryCore.points, nation, player);
        return newEntry;
    }

    
    public populateTable(ws: WebSocketWrapper, entriesArg: Entry[], main: HTMLDivElement, headerRow: {row: HTMLDivElement, pointsPanel: HTMLDivElement, buttonPanel: HTMLDivElement, flagPanel: HTMLDivElement, namePanel: HTMLDivElement, playerPanel: HTMLDivElement}) {
        this.entries = entriesArg;
        main.innerHTML = "";
        const sortSymbols = ["⮝","⮟"];
        let focusedColumn: HTMLDivElement | null = null;
        headerRow.pointsPanel.textContent = "Points";
        //headerRow.flagPanel.textContent = "Flag";
        headerRow.namePanel.textContent = "Nation";
        headerRow.playerPanel.textContent = "Player";
        const thisActually = this;
        for (let column of this.perColComparator.keys()) {
            column.onclick = function() {   
                const rawComparator = thisActually.perColComparator.get(column)!;
                if (focusedColumn != null) {
                    const prev = focusedColumn.textContent!;
                    focusedColumn.textContent = prev.substring(0, prev.length - 1);
                }
                thisActually.filterDirection = focusedColumn == column ? -thisActually.filterDirection : 1;
                focusedColumn = column;
                column.textContent = column.textContent + sortSymbols[thisActually.filterDirection == 1 ? 0 : 1];
                thisActually.comparator = (e1, e2) => thisActually.filterDirection == -1 ? rawComparator(e2, e1) : rawComparator(e1, e2);
                thisActually.sortRows(thisActually.entries);
            };
        }
        headerRow.namePanel.click();
        for (let entry of this.entries) {
            const div = this.setupTableEntry(entry, () => {
                ws.sendMessage(JSON.stringify({type: MessageType.CHANGE_ENTRY, entry: entry.toSendable()}));
            }, (e: Entry) => {
                const newEntries = this.entries.filter(e2 => e2 != e);
                this.populateTable(ws, newEntries, main, headerRow);
            });
            main.appendChild(div);
            entry.div = div;
            entry.addValueChangeListener(() => thisActually.sortRows(this.entries));
        }
        headerRow.namePanel.click();
        headerRow.namePanel.click();
    }

    private setupTableEntry(entry: Entry, sender: () => void, removeEntry: (e: Entry) => void) {
        const {row, indexPanel, pointsPanel, buttonPanel, flagPanel, namePanel, playerPicPanel, playerPanel, removalPanel} = this.buildRowStructure(false);
        pointsPanel.textContent = entry.getPoints().toString();
        entry.addValueChangeListener(() => {
            pointsPanel.textContent = entry.getPoints().toString();
            namePanel.textContent = entry.getNation().getName(this.locUser);
            playerPicPanel.innerHTML = "";
            playerPicPanel.appendChild(entry.getPlayer().makeAvatarImage());
            playerPanel.textContent = entry.getPlayer().getName();
        });

        const up = document.createElement("div");
        const upDownSeparator = document.createElement("div");
        //upDownSeparator.style.width = "50%";
        //upDownSeparator.style.borderBottom = "1px solid var(--font-color)";
        const down = document.createElement("div");
        up.textContent = "⮝";
        down.textContent = "⮟";
        up.onclick = function() {
            entry.setPoints(entry.getPoints() + 1);
            sender();
        };
        down.onclick = function() {
            entry.setPoints(entry.getPoints() - 1);
            sender();
        };
        const thisAp = this;
        removalPanel.onclick = function() {
            removeEntry(entry);
        };
        buttonPanel.appendChild(up);
        buttonPanel.appendChild(upDownSeparator);
        buttonPanel.appendChild(down);

        const flagImage = entry.getNation().makeImage();
        setupCoatOfArmsPolygonClipPath(flagImage);
        flagPanel.appendChild(flagImage);
        const outerThis = this;
        flagPanel.onclick = function() {
            outerThis.popupNationSelectorTable((nation: Nation) => {
                flagPanel.innerHTML = "";
                const newFlagImage = nation.makeImage();
                setupCoatOfArmsPolygonClipPath(newFlagImage);
                flagPanel.appendChild(newFlagImage);
                entry.setNation(nation);
                sender();
            });
        };

        namePanel.textContent = entry.getNation().getName(this.locUser);
        playerPanel.textContent = entry.getPlayer().getName();

        const playerPic = entry.getPlayer().makeAvatarImage();
        playerPicPanel.appendChild(playerPic);
        playerPicPanel.onclick = function() {
            outerThis.popupDiscordUserSelectorTable((user: DiscordUser) => {
                entry.setPlayer(user);
                sender();
            });
        };
        
        return row;
    }

    private buildRowStructure(isTitle: boolean) {
        const row = document.createElement('div');
        const indexPanel = document.createElement('div');
        const pointsPanel = document.createElement('div');
        const buttonPanel = document.createElement('div');
        const flagPanel = document.createElement('div');
        const namePanel = document.createElement('div');
        const playerPicPanel = document.createElement('div');
        const playerPanel = document.createElement('div');
        let removalPanel = document.createElement('div');
        const suffix = isTitle ? "-title" : "";
        row.classList.add("points-table-row");
        for (let suffix of isTitle ? ["", "-title"] : [""]) {
            row.classList.add("points-table-row" + suffix);
            indexPanel.classList.add("point-table-row-index" + suffix);
            pointsPanel.classList.add("point-table-row-points" + suffix);
            buttonPanel.classList.add("point-table-row-buttons" + suffix);
            flagPanel.classList.add("point-table-row-flag" + suffix);
            namePanel.classList.add("point-table-row-name" + suffix);
            playerPicPanel.classList.add("point-table-row-flag" + suffix);
            playerPanel.classList.add("point-table-row-player" + suffix);
            removalPanel.classList.add("point-table-row-removal" + suffix);
        }
        playerPicPanel.classList.add("childIsDiscPic");
        for (let child of [indexPanel, buttonPanel, pointsPanel, flagPanel, namePanel, playerPicPanel, playerPanel, removalPanel]) {
            row.appendChild(child);
        }
        if (!isTitle) {
            const removalChild = document.createElement("div");
            removalPanel.appendChild(removalChild);
            removalChild.textContent = "❌";
            removalPanel = removalChild;
        }
        return {row: row, indexPanel: indexPanel, pointsPanel: pointsPanel, buttonPanel: buttonPanel, flagPanel: flagPanel, namePanel: namePanel, playerPicPanel: playerPicPanel, playerPanel: playerPanel, removalPanel: removalPanel};
    }

    private async exportToClipboard() {
        const localEntries = this.entries.slice();
        localEntries.sort(this.comparator);
        const maxLen = localEntries.map((e) => e.getNation().getName(this.locUser).length).reduce((a, b) => Math.max(a, b), 0);
        const entryToLine = (e: Entry) => e.getPoints().toString().padEnd(2) + " " + e.getNation().getName(this.locUser).padEnd(maxLen) + " <@" + e.getPlayer().getId() + ">";
        let result = "_";
        for (let i = 0; i < localEntries.length; i++) {
            if (i == 0 || this.comparator(localEntries[i], localEntries[i - 1]) != 0) {
                result += "\n";

            }
            result += "\n" + entryToLine(localEntries[i]);   
        }
        await navigator.clipboard.writeText(result);
        console.log(result);
    }

    private sortRows(entries: Entry[]) {
        entries.sort(this.comparator);
        const children = Array.from(this.main.children);
        children.sort((a, b) => {
            const entryA = entries.find(e => e.div == a);
            const entryB = entries.find(e => e.div == b);
            if (entryA && entryB) {
                return this.comparator(entryA, entryB);
            }
            return 0;
        });
        children.forEach(c => this.main.appendChild(c));
        children.forEach((c, i) => {
            const childIndexPanel = c.getElementsByClassName("point-table-row-index")[0];
            if (childIndexPanel.children.length == 0) {
                const div = document.createElement("div");
                childIndexPanel.appendChild(div);
            }
            childIndexPanel.children[0].textContent = (i + 1).toString();
        });
    }

    private popupDiscordUserSelectorTable(callback: (user: DiscordUser) => void) {
        const popupCover = document.createElement("div");
        const popup = document.createElement("div");
        popupCover.classList.add("popup-screencover");
        popup.classList.add("popup");
        popupCover.appendChild(popup);
        document.body.appendChild(popupCover);
        popupCover.onclick = function() {
            document.body.removeChild(popupCover);
        };
        popup.onclick = function(event) {
            event.stopPropagation();
        };
        const table = new ImageSelectionTable("Select User", 6, (user: DiscordUser) => {
            callback(user);
            document.body.removeChild(popupCover);
        });
        table.setLocalisationProvider(this.locProvider);
        table.setLocalisationProvider(this.locProvider);
        table.getPanel().style.width = "400px";
        table.getPanel().style.height = "400px";
        table.setElements(Array.from(this.cachedDiscordUsers.values()));
        popup.appendChild(table.getPanel());
    }

    private popupNationSelectorTable(callback: (nation: Nation) => void) {
        const popupCover = document.createElement("div");
        const popup = document.createElement("div");
        popupCover.classList.add("popup-screencover");
        popup.classList.add("popup");
        popupCover.appendChild(popup);
        document.body.appendChild(popupCover);
        popupCover.onclick = function() {
            document.body.removeChild(popupCover);
        };
        popup.onclick = function(event) {
            event.stopPropagation();
        };
        if (this.cachedNationTable == null) {
            const table = new ImageSelectionTable("Select Nation", 6, (nation: Nation) => {
                callback(nation);
                document.body.removeChild(popupCover);
            });
            table.setLocalisationProvider(this.locProvider);
            table.setLocalisationProvider(this.locProvider);
            table.getPanel().style.width = "400px";
            table.getPanel().style.height = "400px";
            table.setElements(this.game.getAllNations());
            this.cachedNationTable = table;
        }
        popup.appendChild(this.cachedNationTable.getPanel());
        this.cachedNationTable.setCallback((nation: Nation) => {
            callback(nation);
            document.body.removeChild(popupCover);
        });
    }
    
    private popupColonySelectorDialog(callback: (overlord: Nation, region: ColonialRegion)=> void) {
        const popupCover = document.createElement("div");
        const popup = document.createElement("div");
        popupCover.classList.add("popup-screencover");
        popup.classList.add("popup");
        popupCover.appendChild(popup);
        document.body.appendChild(popupCover);
        popupCover.onclick = function() {
            document.body.removeChild(popupCover);
        };
        popup.onclick = function(event) {
            event.stopPropagation();
        };
        const overlordTable = new ImageSelectionTable("Select Overlord", 6, (overlord: INation) => {
            document.body.removeChild(popupCover);
        });
        overlordTable.setLocalisationProvider(this.locProvider);
        overlordTable.setLocalisationProvider(this.locProvider);
        overlordTable.getPanel().style.width = "400px";
        overlordTable.getPanel().style.height = "400px";
        overlordTable.setElements(this.entries.map(e => e.getNation()));
        popup.appendChild(overlordTable.getPanel());
    }
    
    private triggerPopup(attachChildren: (popup: HTMLDivElement) => void): void {
        const popupCover = document.createElement("div");
        const popup = document.createElement("div");
        popupCover.classList.add("popup-screencover");
        popup.classList.add("popup");
        popupCover.appendChild(popup);
        document.body.appendChild(popupCover);
        attachChildren(popup);
    }

    private async reImportFromDiscord(): Promise<Entry[]> {
        return new Discord().reImportFromDiscord(this.nationGuesser, this.game);
    }
}