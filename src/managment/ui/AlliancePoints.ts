import { createDiv, getCircularPolygonClipPath, getCoatOfArmsPolygonClipPath, getCookie, ifHasCookieValueGetElseSetAndReturn, setCookie, setupCoatOfArmsPolygonClipPath } from "../../utils";
import { Discord } from "../points/Discord";
import { Entry, SendableEntry } from "../points/Entry";
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
import { ITabApp } from "../../ui/ITabApp";
import { ImageUtil, RBGSet, RGB } from "../../util/ImageUtil";
import { Skanderbeg } from "../../skanderbeg/Skanderbeg";
import { MapUtil } from "../../MapUtil";

enum CheckinStatus {
    NONE,
    OK,
    FAIL,
    SERVER_CLOSED
}
enum MessageType {    

    INTRO = "intro", //TODO
    DASHBOARD_DATA = "dashboard", //TODO

    CHECKIN = "checkin",
    REQUESTING_DATA = "request",
    DATA_DELIVERY = "delivery",
    DISCORD_DATA = "discord", // TODO
    CHECKIN_OK = "checkinok",
    CHECKIN_FAIL = "checkinfail"
}

export class AlliancePoints implements ITabApp {

    private comparator  = (a: Entry, b: Entry) => b.getPoints() - a.getPoints();
    private perColComparator = new Map<HTMLDivElement, ((e1: Entry, e2: Entry) => number)>();
    private filterDirection = 1;
    private main: HTMLDivElement;
    private pointsWrapper: HTMLDivElement;
    private locUser: AbstractLocalisationUser;
    private entries: Entry[] = [];

    private pw: string;
    private lobbyID: string;
    private cachedNationTable: ImageSelectionTable<Nation> | null = null;

    private discord = new Discord();

    private wsWrapper: WebSocketWrapper;
    private statusIndicator: (status: CheckinStatus) => void = () => {};

    constructor(socketUrl: string, private locProvider: ILocalisationProvider, private nationGuesser: Guesser, private game: Game) {
        this.pointsWrapper = document.createElement('div');
        this.pointsWrapper.classList.add("points-table");

        this.locUser = new class extends AbstractLocalisationUser  {
        };
        this.locUser.setLocalisationProvider(locProvider);
        this.main = createDiv("points-table-body");
        const apThis = this;
        const ws = new WebSocket(socketUrl);
        
        //TODO: send client id to server, get history,user config etc back
        const userClientId = ifHasCookieValueGetElseSetAndReturn("app_client_id", Math.random().toString());
        const initId = getCookie("ap_id");
        const initPw = getCookie("ap_pw");
        if (initId != null && initPw != null) {
            this.lobbyID = initId
            this.pw = initPw;
        } else {
            this.lobbyID = "";
            this.pw = "";
        }
        this.discord.importUsers().then((users) => {
            
        });
        this.wsWrapper = new WebSocketWrapper(ws, (wsWrapper: WebSocketWrapper) => {
            apThis.setupUI();
        });
    }

    getPanel(): HTMLDivElement {
        return this.pointsWrapper;
    }

    private setupUI() {
        const thisAp = this;
        const tableHeader = createDiv("points-table-header");
        const headerheader = createDiv("points-table-top");
        headerheader.appendChild(this.setupInputs());
        tableHeader.appendChild(headerheader);
        this.pointsWrapper.appendChild(tableHeader);
        const headerRow = this.buildRowStructure(true);
        this.perColComparator.set(headerRow.pointsPanel, (e1, e2) => e1.getPoints() - e2.getPoints());
        this.perColComparator.set(headerRow.namePanel, (e1, e2) => e1.getNation().getAlias().localeCompare(e2.getNation().getAlias()));
        this.perColComparator.set(headerRow.playerPanel, (e1, e2) => e1.getPlayer().getName().localeCompare(e2.getPlayer().getName()));
        tableHeader.appendChild(headerRow.row);
        this.pointsWrapper.appendChild(this.main);
        headerheader.appendChild(this.setupButtons(this.wsWrapper, headerRow));
        this.wsWrapper.setOnMessage(event =>  {
            const eventData = JSON.parse(event.data);
            if (eventData.type == MessageType.CHECKIN_OK) {
                this.statusIndicator(CheckinStatus.OK);
            }
            if (eventData.type == MessageType.DATA_DELIVERY || eventData.type == MessageType.CHECKIN_OK) {
                const packedEntries = eventData.data;
                const unpackedEntries: Entry[] = [];
                for (let entryCore of packedEntries) {
                    unpackedEntries.push(this.unpackEntry(entryCore));
                }
                thisAp.populateTable(unpackedEntries, thisAp.main, headerRow);
            } else if (eventData.type == MessageType.CHECKIN_FAIL) {
                this.statusIndicator(CheckinStatus.FAIL);
            }
        });
    }

    private sendAuthorizedMessage(type: MessageType, data: SendableEntry[]) {
        this.wsWrapper.sendMessage({type: type, lobbyID: this.lobbyID, password: this.pw, data: data});
    }

    private unpackEntry(entryCore: SendableEntry) {
        let nation = this.game.getNationByTag(entryCore.nation);
        if (nation == null) {
            nation = OverrideNation.fabricateDummyNation("???", this.game)
        }
        let player = this.discord.getCachedDiscordUsers().get(entryCore.player);
        if (player == null) {
            player = this.discord.getNewNoUserUser();
        }
        return new Entry(entryCore.points, nation, player);
    }

    
    public populateTable(entriesArg: Entry[], main: HTMLDivElement, headerRow: {row: HTMLDivElement, pointsPanel: HTMLDivElement, buttonPanel: HTMLDivElement, flagPanel: HTMLDivElement, namePanel: HTMLDivElement, playerPanel: HTMLDivElement}) {
        this.entries = entriesArg;
        main.innerHTML = "";
        const sortSymbols = [" ⮝"," ⮟"];
        let focusedColumn: HTMLDivElement | null = null;
        headerRow.pointsPanel.textContent = "Points";
        headerRow.namePanel.textContent = "Nation";
        headerRow.playerPanel.textContent = "Player";
        const thisActually = this;
        for (let column of this.perColComparator.keys()) {
            column.onclick = function() {   
                const rawComparator = thisActually.perColComparator.get(column)!;
                if (focusedColumn != null) {
                    const prev = focusedColumn.textContent!;
                    focusedColumn.textContent = prev.substring(0, prev.length - sortSymbols[0].length);
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
                this.sendAuthorizedMessage(MessageType.DATA_DELIVERY, this.entries.map(e => e.toSendable()));
            }, (e: Entry) => {
                const newEntries = this.entries.filter(e2 => e2 != e);
                this.populateTable(newEntries, main, headerRow);
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
            namePanel.textContent = entry.getNation().getAlias();
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
            sender();
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

        namePanel.textContent = entry.getNation().getAlias();
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
        for (let suffix of isTitle ? ["", "-title"] : [""]) {
            row.classList.add("points-table-row" + suffix);
        }
        if (isTitle) {
            row.classList.add("ptr-title");
        }
        playerPicPanel.classList.add("ptr-player-img-parent");
        flagPanel.classList.add("ptr-flag-img-parent");
        for (let child of [indexPanel, buttonPanel, pointsPanel, flagPanel, namePanel, playerPicPanel, playerPanel, removalPanel]) {
            row.appendChild(child);
            child.classList.add("ptr-cell");
        }
        pointsPanel.style.width = "100px";
        namePanel.style.width = "300px";
        playerPanel.style.width = "400px";
        removalPanel.classList.add("parentofClickable");
        buttonPanel.classList.add("parentofClickable");
        buttonPanel.classList.add("parentOfBigControlElement")
        buttonPanel.style.fontSize = "calc(0.35 * var(--points-row-height))";
        buttonPanel.classList.add("ptr-big-font");
        pointsPanel.classList.add("ptr-big-font");

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
        const maxLen = localEntries.map((e) => e.getNation().getAlias().length).reduce((a, b) => Math.max(a, b), 0);
        const entryToLine = (e: Entry) => e.getPoints().toString().padEnd(2) + " " + e.getNation().getAlias().padEnd(maxLen) + " <@" + e.getPlayer().getId() + ">";
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
            const childIndexPanel = c.firstChild as HTMLDivElement;
            if (childIndexPanel.children.length == 0) {
                const div = document.createElement("div");
                childIndexPanel.appendChild(div);
            }
            childIndexPanel.children[0].textContent = (i + 1).toString();
        });
    }

    private static getPopupContainer() {
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
        return {popupCover: popupCover, popup: popup};
    }

    private popupDiscordUserSelectorTable(callback: (user: DiscordUser) => void) {
        const {popupCover, popup} = AlliancePoints.getPopupContainer();
        const table = new ImageSelectionTable("Select User", 6, (user: DiscordUser) => {
            callback(user);
            document.body.removeChild(popupCover);
        });
        table.setLocalisationProvider(this.locProvider);
        table.setLocalisationProvider(this.locProvider);
        table.getPanel().style.width = "400px";
        table.getPanel().style.height = "400px";
        table.setElements(Array.from(this.discord.getCachedDiscordUsers().values()));
        popup.appendChild(table.getPanel());
    }

    private popupNationSelectorTable(callback: (nation: Nation) => void) {
        const {popupCover, popup} = AlliancePoints.getPopupContainer();
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
        const {popupCover, popup} = AlliancePoints.getPopupContainer();
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

    private async reImportFromDiscord(): Promise<Entry[]> {
        return this.discord.reImportFromDiscord(this.nationGuesser, this.game);
    }

    private setupInputs() {
        const inputParent = document.createElement("div");
        inputParent.classList.add("horizontal-container");
        inputParent.appendChild(this.fabricateInputButtonCombo(["Lobby ID", "Password"], "📡", [false,false], [this.lobbyID, this.pw], (inputs) => {
            const lobbyID = inputs[0];
            const pw = inputs[1];
            this.lobbyID = lobbyID;
            this.pw = pw;
            setCookie("ap_id", lobbyID, 30);
            setCookie("ap_pw", pw, 30);
            this.sendAuthorizedMessage(MessageType.CHECKIN, []);
        }));
        this.statusIndicator = (status: CheckinStatus) => {
            const target = inputParent.firstChild!.lastChild as HTMLDivElement;
            if (status == CheckinStatus.OK) {
                target.textContent = "✅";
            } else if (status == CheckinStatus.FAIL) {
                target.textContent = "❌";
            } else if (status == CheckinStatus.SERVER_CLOSED) {
                target.textContent = "💀";
            } else if (status == CheckinStatus.NONE) {
                target.textContent = "📡";
            }
        };
        return inputParent;
    }

    private fabricateInputButtonCombo(placeholder: string[], buttonText: string, isSecret: boolean[], initialValues: string[], buttonCallback: (inputValues: string[]) => void) {
        const comboWrapper = document.createElement("div");
        comboWrapper.classList.add("horizontal-container");
        comboWrapper.classList.add("points-ui-input-combo");
        for (let i = 0; i < placeholder.length; i++) {
            const input = document.createElement("input");
            input.type = isSecret[i] ? "password" : "text";
            input.placeholder = placeholder[i];
            input.value = initialValues[i];
            comboWrapper.appendChild(input);
        }
        const button = document.createElement("div");
        button.textContent = buttonText;
        comboWrapper.appendChild(button);
        button.onclick = function() {
            buttonCallback(Array.from(comboWrapper.children).filter((c) => c instanceof HTMLInputElement).map((c) => (c as HTMLInputElement).value));
        };
        return comboWrapper;
    }

    private setupButtons(ws: WebSocketWrapper, headerRow: {row: HTMLDivElement, pointsPanel: HTMLDivElement, buttonPanel: HTMLDivElement, flagPanel: HTMLDivElement, namePanel: HTMLDivElement, playerPanel: HTMLDivElement}) {
        const buttonParent = document.createElement("div");
        const editingButtonParent = document.createElement("div");
        const extraButtonParent = document.createElement("div");
        buttonParent.classList.add("horizontal-container");
        buttonParent.classList.add("points-ui-button-panel");
        buttonParent.appendChild(editingButtonParent);
        buttonParent.appendChild(extraButtonParent);
        for (let parent of [editingButtonParent, extraButtonParent]) {
            parent.classList.add("horizontal-container");
            parent.classList.add("parentofClickable");
        }
        const importFromDiscord = document.createElement("div");	
        importFromDiscord.textContent = "🡓DC";
        editingButtonParent.appendChild(importFromDiscord);

        const addEntryButton = document.createElement("div");
        addEntryButton.textContent = "➕";
        editingButtonParent.appendChild(addEntryButton);

        const addColonialEntryButton = document.createElement("div");
        addColonialEntryButton.textContent = "➕🏝️";
        editingButtonParent.appendChild(addColonialEntryButton);

        const toImage = document.createElement("div");
        toImage.textContent = "📷";
        extraButtonParent.appendChild(toImage);

        const toMap = document.createElement("div");
        toMap.textContent = "🗺️";
        extraButtonParent.appendChild(toMap);

        const exportToClipboard = document.createElement("div");
        exportToClipboard.textContent = "📋"
        extraButtonParent.appendChild(exportToClipboard);
        const thisAp = this;
        importFromDiscord.onclick = function() {
            thisAp.reImportFromDiscord().then((importedEntries) => {
                const sorted = importedEntries.sort((a, b) => a.getNation().getAlias().localeCompare(b.getNation().getAlias()));
                thisAp.populateTable(sorted, thisAp.main, headerRow);
            });
        };
        exportToClipboard.onclick = function() {
            thisAp.exportToClipboard();
        };
        addEntryButton.onclick = function() {
            const newEntry = new Entry(Entry.DEFAULT_POINTS, OverrideNation.fabricateDummyNation("???", thisAp.game), thisAp.discord.getNewNoUserUser());
            const newEntries = thisAp.entries.concat([newEntry]);
            thisAp.populateTable(newEntries, thisAp.main, headerRow);
        };
        addColonialEntryButton.onclick = function() {
            
        };
        toImage.onclick = function() {
            document.fonts.ready.then(() => {
                AlliancePoints.exportAsImage("Bündnispunkte", thisAp.entries);
            });
        };
        toMap.onclick = function() {
            const provinceId2Color = new Map<number, RGB>();
            thisAp.game.getProvinces().forEach((p) => {
                if (p.is1444Owned()) {
                    const owner = p.get1444OwnerTag();
                    provinceId2Color.set(p.getId(), thisAp.game.getTag2Color(owner)!);
                } else {
                    provinceId2Color.set(p.getId(), MapUtil.getUnownedColor(p));
                }
            });
            new Skanderbeg("f8b478").getAllProvinceOwnerships().then((provinceId2OwnerTag) => {
                for (let [id, tag] of provinceId2OwnerTag) {
                    provinceId2Color.set(id, thisAp.game.getTag2Color(tag)!);
                }
                const interestingColors = thisAp.entries.map(e => thisAp.game.getTag2Color(e.getNation().getTag())!);
                thisAp.exportToMap(provinceId2Color, interestingColors);
            });
        };
        return buttonParent;
    }

    private static exportAsImage(title: string, entries: Entry[]) {
        const scale = 1;
        const flagScale = 0.8;
        const avatarScale = 0.6;
        const avatarSpacing = 1 - avatarScale;
        const fontFamily = "Inter";
        const thick = 4;
        const thin = 1;

        const pointSortedEntries = entries.slice().sort((a, b) => a.getNation().getAlias().localeCompare(b.getNation().getAlias()));
        pointSortedEntries.sort((a, b) => b.getPoints() - a.getPoints());	
        const canvas = document.createElement("canvas");
        const style = getComputedStyle(document.documentElement);
        const perRowHeight = scale * Number.parseInt(style.getPropertyValue("--points-row-height").replace("px", ""));
        const bigFontSize = (2 * perRowHeight/ 3);
        const fontSize = scale * Number.parseInt(style.getPropertyValue("--points-table-font-size").replace("px", ""));
        const fontColor = style.getPropertyValue("--font-color");
        const mainColor = style.getPropertyValue("--main-color");
        const headerPixelHeight = perRowHeight * 1.5;
        canvas.height = headerPixelHeight + perRowHeight * pointSortedEntries.length;
        canvas.width = scale * 900 + perRowHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = mainColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = fontColor;
        ctx.strokeStyle = fontColor;
        ctx.lineWidth = thick;
        ctx.strokeRect(0+thick/2, 0 + thick/2, canvas.width - thick/2 - 1, canvas.height - thick/2 - 1);

        ctx.font = bigFontSize + "px " + fontFamily;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(title, canvas.width / 2, 0.6 * headerPixelHeight);
        for (let i = 0; i < pointSortedEntries.length; i++) {
            ctx.lineWidth = i != 0 && pointSortedEntries[i].getPoints() === pointSortedEntries[i - 1].getPoints() ? thin : thick;
            console.log(i + " " + ctx.lineWidth);
            ctx.beginPath();
            ctx.moveTo(0, headerPixelHeight + i * perRowHeight);
            ctx.lineTo(canvas.width, headerPixelHeight + i * perRowHeight);
            ctx.stroke();
        }
        ctx.lineWidth = thin
        ctx.font = bigFontSize + "px " + fontFamily;
        ctx.textBaseline = "middle";    
        const flagGuideX = 2 * perRowHeight;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(perRowHeight, headerPixelHeight);
        ctx.lineTo(perRowHeight, headerPixelHeight + perRowHeight * pointSortedEntries.length);
        ctx.stroke();
        ctx.globalAlpha = 1;

        for (let i = 0; i < pointSortedEntries.length; i++) {
            ctx.font = fontSize + "px " + fontFamily;
            ctx.fillStyle = fontColor;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.globalAlpha = 0.5;
            ctx.fillText((i + 1).toString(), perRowHeight/2, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
            ctx.globalAlpha = 1;

            ctx.textBaseline = "middle";    
            ctx.textAlign = "right";
            ctx.font = bigFontSize + "px " + fontFamily;
            if (i == 0 || pointSortedEntries[i].getPoints() != pointSortedEntries[i - 1].getPoints()) {
                ctx.fillText(pointSortedEntries[i].getPoints().toString(), flagGuideX, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
            }
            const imageSize = perRowHeight * flagScale;
            ImageUtil.drawImage(ctx, pointSortedEntries[i].getNation().makeImage().src, flagGuideX + imageSize, headerPixelHeight + ((1 - flagScale)/2 + i) * perRowHeight, imageSize, getCoatOfArmsPolygonClipPath(), false);
            ctx.textAlign = "left";
            ctx.font = fontSize + "px " + fontFamily;
            ctx.fillText(pointSortedEntries[i].getNation().getAlias(), flagGuideX + 3 * imageSize, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
            const userImageUrl = pointSortedEntries[i].getPlayer().makeAvatarImage().src;
            const avatarSize = perRowHeight * avatarScale;
            ImageUtil.drawImage(ctx, userImageUrl, flagGuideX + 2.5 * imageSize + avatarSize + 2 * perRowHeight, headerPixelHeight + ((avatarSpacing)/2 + i) * perRowHeight, avatarSize, getCircularPolygonClipPath(), false);
            ctx.fillText(pointSortedEntries[i].getPlayer().getName(), flagGuideX + 2.5 * imageSize + avatarSize + 3 * perRowHeight, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
        }
        canvas.style.height = "calc(100vh - 100px)";
        canvas.style.width = "auto";
        const {popupCover, popup} = this.getPopupContainer();
        popup.appendChild(canvas);
    }

    private async exportToMap(provinceId2Color: Map<number, RGB>, interestingColors: RGB[]) {
        const provinceColorToTargetColor = new Map<RGB, RGB>();
        for (let province of this.game.getProvinces()) {
            const provinceColorCode = province.getColorCode();
            const targetColor = provinceId2Color.get(province.getId())!;
            provinceColorToTargetColor.set(provinceColorCode, targetColor);
        }
        const canvas = await MapUtil.drawMap(provinceColorToTargetColor, interestingColors);
        const {popupCover, popup} = AlliancePoints.getPopupContainer();
        canvas.style.maxWidth = "calc(100vw - 200px)";
        canvas.style.maxHeight = "auto";
        popup.appendChild(canvas);
    }
}