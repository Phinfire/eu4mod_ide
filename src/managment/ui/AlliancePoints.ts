import { createDiv, getCircularPolygonClipPath, getCoatOfArmsPolygonClipPath, getCookie, ifHasCookieValueGetElseSetAndReturn, setCookie, setupCoatOfArmsPolygonClipPath } from "../../utils";
import { Discord } from "../points/Discord";
import { Entry, SendableEntry } from "../points/Entry";
import { Nation } from "../../model/Nation";
import { ImageSelectionTable } from "../../ui/ImageSelectionTable";
import { Game } from "../../model/Game";
import { AbstractLocalisationUser } from "../../model/localisation/AbstractLocalisationUser";
import { INation } from "../../model/INation";
import { DiscordUser } from "../points/DiscordUser";
import { OverrideNation } from "../../model/OverrideNation";
import { ITabApp } from "../../ui/ITabApp";
import { ImageUtil, RGB } from "../../util/ImageUtil";
import { Skanderbeg } from "../../skanderbeg/Skanderbeg";
import { MapUtil } from "../../MapUtil";
import { Lobby } from "../lobbies/Lobby";
import { AppWrapper } from "../../ui/AppWrapper";
import { UIFactory } from "../../UIFactory";

export class AlliancePoints implements ITabApp {

    private comparator  = (a: Entry, b: Entry) => b.getPoints() - a.getPoints();
    private perColComparator = new Map<HTMLDivElement, ((e1: Entry, e2: Entry) => number)>();
    private filterDirection = 1;
    private main: HTMLDivElement;
    private pointsWrapper: HTMLDivElement;  

    private cachedNationTable: ImageSelectionTable<Nation> | null = null;
    private cachedUserTable: ImageSelectionTable<DiscordUser> | null = null;
    
    private lobby: Lobby | null = null;
    private headerRow;
    private focusedColumn: HTMLDivElement | null = null;

    private nationNameFunc = (entry: Entry) => entry.getNation().getName(this.locUser);

    constructor(private locUser: AbstractLocalisationUser, private game: Game, private discord: Discord, private onEscape: () => void, private onAnyChange: (lobby: Lobby) => void) {
        this.pointsWrapper = document.createElement('div');
        this.pointsWrapper.classList.add("points-table");
        this.main = createDiv("points-table-body");
        this.headerRow = this.setupUI();
        this.pointsWrapper.ondragover = (ev) => {
            ev.preventDefault();
        };
        this.pointsWrapper.ondrop = (ev) => {
            ev.preventDefault();
            const file = ev.dataTransfer!.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = JSON.parse(reader.result as string) as SendableEntry[];
                const entries = data.map(e => Entry.fromSendable(e, this.game, this.discord));
                this.lobby!.setEntries(entries);
                this.populateTable(this.main, this.headerRow);
                this.onAnyChange(this.lobby!);
            };
            reader.readAsText(file);
        };
    }

    getPanel(): HTMLDivElement {
        return this.pointsWrapper;
    }

    public displayLobby(lobby: Lobby) {
        this.lobby = lobby;
        this.populateTable(this.main, this.headerRow);
    }

    private setupUI() {
        const tableHeader = createDiv("points-table-header");
        const headerheader = createDiv("points-table-top");
        tableHeader.appendChild(headerheader);
        this.pointsWrapper.appendChild(tableHeader);
        const headerRow = this.buildRowStructure(true);
        this.perColComparator.set(headerRow.pointsPanel, (e1, e2) => e1.getPoints() - e2.getPoints());
        this.perColComparator.set(headerRow.namePanel, (e1, e2) => this.nationNameFunc(e1).localeCompare(this.nationNameFunc(e2)));
        this.perColComparator.set(headerRow.playerPanel, (e1, e2) => e1.getPlayer().getName().localeCompare(e2.getPlayer().getName()));
        tableHeader.appendChild(headerRow.row);
        this.pointsWrapper.appendChild(this.main);
        headerheader.appendChild(this.setupButtons(headerRow));
        const thisActually = this;
        const sortSymbols = [UIFactory.SORT_SYMBOL_ARROW_UP, UIFactory.SORT_SYMBOL_ARROW_DOWN].map(s => " " + s);
        headerRow.pointsPanel.textContent = "Points";
        headerRow.namePanel.textContent = "Nation";
        headerRow.playerPanel.textContent = "Player";
        for (let column of this.perColComparator.keys()) {
            column.onclick = function() {
                const rawComparator = thisActually.perColComparator.get(column)!;
                if (thisActually.focusedColumn != null) {
                    const prev = thisActually.focusedColumn.textContent!;
                    thisActually.focusedColumn.textContent = prev.substring(0, prev.length - sortSymbols[0].length);
                }
                thisActually.filterDirection = thisActually.focusedColumn == column ? -thisActually.filterDirection : 1;
                thisActually.focusedColumn = column;
                column.textContent = column.textContent + sortSymbols[thisActually.filterDirection == 1 ? 0 : 1];
                thisActually.comparator = (e1, e2) => thisActually.filterDirection == -1 ? rawComparator(e2, e1) : rawComparator(e1, e2);
                thisActually.sortRows(thisActually.lobby!.getEntries());
            };
        }
        return headerRow;
    }
    
    public populateTable(main: HTMLDivElement, headerRow: {row: HTMLDivElement, pointsPanel: HTMLDivElement, buttonPanel: HTMLDivElement, flagPanel: HTMLDivElement, namePanel: HTMLDivElement, playerPanel: HTMLDivElement}) {
        main.innerHTML = "";
        const thisActually = this;
        for (let entry of this.lobby!.getEntries()) {
            const div = this.setupTableEntry(entry, () => {
                this.onAnyChange(this.lobby!);
            }, (e: Entry) => {
                const newEntries = this.lobby!.getEntries().filter(e2 => e2 != e);
                this.lobby!.setEntries(newEntries);
                this.populateTable(main, headerRow);
                this.onAnyChange(this.lobby!);
            });
            main.appendChild(div);
            entry.div = div;
            entry.addValueChangeListener(() => thisActually.sortRows(this.lobby!.getEntries()));
        }
        this.sortRows(this.lobby!.getEntries());
    }

    private setupTableEntry(entry: Entry, sender: () => void, removeEntry: (e: Entry) => void) {
        const {row, indexPanel, pointsPanel, buttonPanel, flagPanel, namePanel, playerPicPanel, playerPanel, removalPanel} = this.buildRowStructure(false);
        pointsPanel.textContent = entry.getPoints().toString();
        entry.addValueChangeListener(() => {
            pointsPanel.textContent = entry.getPoints().toString();
            namePanel.textContent = this.locUser.localise(entry.getNation().getName(this.locUser));
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

        namePanel.textContent = this.locUser.localise(entry.getNation().getName(this.locUser));
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
            removalChild.textContent = UIFactory.RED_X;
            removalPanel = removalChild;    
        }
        return {row: row, indexPanel: indexPanel, pointsPanel: pointsPanel, buttonPanel: buttonPanel, flagPanel: flagPanel, namePanel: namePanel, playerPicPanel: playerPicPanel, playerPanel: playerPanel, removalPanel: removalPanel};
    }

    private async exportAsText() {
        const localEntries = this.lobby!.getEntries().slice();
        localEntries.sort(this.comparator);
        const maxLen = Math.max(...localEntries.map(e => this.nationNameFunc(e).length));
        console.log(maxLen);
        const entryToLine = (e: Entry) => e.getPoints().toString().padEnd(2) + " " + this.nationNameFunc(e).padEnd(maxLen) + " <@" + e.getPlayer().getId() + ">";
        let result = "_\n";
        for (let i = 0; i < localEntries.length; i++) {
            if (i > 0 && this.comparator(localEntries[i], localEntries[i - 1]) != 0) {
                result += "\n";
            }
            result += "\n" + entryToLine(localEntries[i]);   
        }
        const popup = AppWrapper.getPopupContainer();
        const textPanel  = document.createElement("textarea");
        textPanel.value = result;
        textPanel.style.width = "600px";
        textPanel.style.height = "900px";
        popup.popup.appendChild(textPanel);
        textPanel.style.backgroundColor = "var(--main-color)";
        textPanel.style.fontFamily = "monospace";
        textPanel.innerHTML = result;
        textPanel.readOnly = true;
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

    private popupDiscordUserSelectorTable(callback: (user: DiscordUser) => void) {
        const {popupCover, popup} = AppWrapper.getPopupContainer();
        const table = new ImageSelectionTable("Select User", 6, (user: DiscordUser) => user.getName(), (user: DiscordUser) => {
            callback(user);
            document.body.removeChild(popupCover);
        });
        table.getPanel().style.width = "400px";
        table.getPanel().style.height = "400px";
        table.setElements(Array.from(this.discord.getCachedDiscordUsers().values()));
        popup.appendChild(table.getPanel());
    }

    private popupNationSelectorTable(callback: (nation: Nation) => void) {
        const {popupCover, popup} = AppWrapper.getPopupContainer();
        if (this.cachedNationTable == null) {
            const table = new ImageSelectionTable("Select Nation", 6, (nation: INation) => nation.getName(this.locUser), (nation: Nation) => {
                callback(nation);
                document.body.removeChild(popupCover);
                table.resetFilter();
            });
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

    private setupButtons(headerRow: {row: HTMLDivElement, pointsPanel: HTMLDivElement, buttonPanel: HTMLDivElement, flagPanel: HTMLDivElement, namePanel: HTMLDivElement, playerPanel: HTMLDivElement}) {
        const buttonParent = document.createElement("div");
        const appButtonParent = document.createElement("div");
        const editingButtonParent = document.createElement("div");
        const extraButtonParent = document.createElement("div");
        buttonParent.classList.add("horizontal-container");
        buttonParent.classList.add("points-ui-button-panel");
        buttonParent.appendChild(appButtonParent);
        buttonParent.appendChild(editingButtonParent);
        buttonParent.appendChild(extraButtonParent);
        for (let parent of [appButtonParent, editingButtonParent, extraButtonParent]) {
            parent.classList.add("horizontal-container");
            parent.classList.add("parentofClickable");
        }
        const homeButton = document.createElement("div");
        homeButton.textContent = "🏠";
        appButtonParent.appendChild(homeButton);
        homeButton.onclick = this.onEscape;

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

        const exportToJson = document.createElement("div");
        exportToJson.textContent = "{}";
        extraButtonParent.appendChild(exportToJson);
        exportToJson.onclick = function() {
            thisAp.downloadAsJson();
        };

        const thisAp = this;
        exportToClipboard.onclick = function() {
            thisAp.exportAsText();
        };
        addEntryButton.onclick = function() {
            const newEntry = new Entry(Entry.DEFAULT_POINTS, OverrideNation.fabricateDummyNation("???", thisAp.game), thisAp.discord.getNewNoUserUser());
            const newEntries = thisAp.lobby!.getEntries().concat([newEntry]);
            thisAp.lobby!.setEntries(newEntries);
            thisAp.populateTable(thisAp.main, headerRow);
        };
        addColonialEntryButton.onclick = function() {
            
        };
        toImage.onclick = function() {
            document.fonts.ready.then(() => {
                const canvas = thisAp.exportAsImage("Bündnispunkte", thisAp.lobby!.getEntries());
                const {popupCover, popup} = AppWrapper.getPopupContainer();
                popup.appendChild(canvas);
            });
        };
        toMap.onclick = function() {
            if (thisAp.lobby!.hasSkanderbegIdentifier()) {
                const provinceId2Color = new Map<number, RGB>();
                thisAp.game.getProvinces().forEach((p) => {
                    if (p.is1444Owned()) {
                        const owner = p.get1444OwnerTag();
                        provinceId2Color.set(p.getId(), thisAp.game.getTag2Color(owner)!);
                    } else {
                        provinceId2Color.set(p.getId(), MapUtil.getUnownedColor(p));
                    }
                });
                new Skanderbeg(thisAp.lobby!.getAssociatedSkanderbegIdentifier()).getAllProvinceOwnerships().then((provinceId2OwnerTag) => {
                    for (let [id, tag] of provinceId2OwnerTag) {
                        provinceId2Color.set(id, thisAp.game.getTag2Color(tag)!);
                    }
                    const interestingColors = thisAp.lobby!.getEntries().map(e => thisAp.game.getTag2Color(e.getNation().getTag())!);
                    thisAp.exportToMap(provinceId2Color, interestingColors);
                });
            }
        };
        return buttonParent;
    }

    private exportAsImage(title: string, entries: Entry[], includeUsers: boolean = true, includePoints: boolean = true) {
        const scale = 1;
        const flagScale = 0.8;
        const avatarScale = 0.6;
        const fontFamily = "Inter";
        const thick = 4;
        const thin = 1;

        const pointSortedEntries = entries.slice().sort((a, b) => this.nationNameFunc(a).localeCompare(this.nationNameFunc(b)));
        pointSortedEntries.sort((a, b) => b.getPoints() - a.getPoints());	
        const style = getComputedStyle(document.documentElement);
        const perRowHeight = scale * Number.parseInt(style.getPropertyValue("--points-row-height").replace("px", ""));
        const bigFontSize = (2 * perRowHeight/ 3);
        const fontSize = scale * Number.parseInt(style.getPropertyValue("--points-table-font-size").replace("px", ""));
        const textColor = style.getPropertyValue("--font-color");
        const backgroundColor = style.getPropertyValue("--main-color");
        const headerPixelHeight = perRowHeight * 1.5;

        // background & frame
        const canvas = document.createElement("canvas");
        canvas.height = headerPixelHeight + perRowHeight * pointSortedEntries.length;
        canvas.width = scale * 900 + perRowHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = textColor;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = thick;
        ctx.strokeRect(0+thick/2, 0 + thick/2, canvas.width - thick/2 - 1, canvas.height - thick/2 - 1);

        // row lines
        ctx.font = bigFontSize + "px " + fontFamily;
        ctx.textAlign = "center";   
        ctx.textBaseline = "middle";
        ctx.fillText(title, canvas.width / 2, 0.6 * headerPixelHeight);
        for (let i = 0; i < pointSortedEntries.length; i++) {
            ctx.lineWidth = i != 0 && pointSortedEntries[i].getPoints() === pointSortedEntries[i - 1].getPoints() ? thin : thick;
            ctx.beginPath();
            ctx.moveTo(0, headerPixelHeight + i * perRowHeight);
            ctx.lineTo(canvas.width, headerPixelHeight + i * perRowHeight);
            ctx.stroke();
        }
        // line separating index and entry
        ctx.lineWidth = thin
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(perRowHeight, headerPixelHeight);
        ctx.lineTo(perRowHeight, headerPixelHeight + perRowHeight * pointSortedEntries.length);
        ctx.stroke();
        ctx.globalAlpha = 1;

        for (let i = 0; i < pointSortedEntries.length; i++) {
            ctx.font = fontSize + "px " + fontFamily;
            ctx.fillStyle = textColor;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.globalAlpha = 0.5;
            ctx.fillText((i + 1).toString(), perRowHeight/2, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
            ctx.globalAlpha = 1;

            ctx.textAlign = "right";
            ctx.font = bigFontSize + "px " + fontFamily;
            if (i == 0 || pointSortedEntries[i].getPoints() != pointSortedEntries[i - 1].getPoints()) {
                ctx.fillText(pointSortedEntries[i].getPoints().toString(), 2 * perRowHeight, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
            }
            const imageSize = perRowHeight * flagScale;
            ImageUtil.drawImage(ctx, pointSortedEntries[i].getNation().makeImage().src, 2 * perRowHeight + imageSize, headerPixelHeight + ((1 - flagScale)/2 + i) * perRowHeight, imageSize, getCoatOfArmsPolygonClipPath(), false);
            ctx.textAlign = "left";
            ctx.font = fontSize + "px " + fontFamily;
            ctx.fillText(this.nationNameFunc(pointSortedEntries[i]), 2 * perRowHeight + 3 * imageSize, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
            const userImageUrl = pointSortedEntries[i].getPlayer().makeAvatarImage().src;
            const avatarSize = perRowHeight * avatarScale;
            ImageUtil.drawImage(ctx, userImageUrl, 2 * perRowHeight + 2.5 * imageSize + avatarSize + 2 * perRowHeight, headerPixelHeight + ((1 - avatarScale)/2 + i) * perRowHeight, avatarSize, getCircularPolygonClipPath(), false);
            ctx.fillText(pointSortedEntries[i].getPlayer().getName(), 2 * perRowHeight + 2.5 * imageSize + avatarSize + 3 * perRowHeight, headerPixelHeight + i * perRowHeight + perRowHeight / 2);
        }
        canvas.style.height = "calc(100vh - 100px)";
        canvas.style.width = "auto";
        return canvas;
    }

    private async exportToMap(provinceId2Color: Map<number, RGB>, interestingColors: RGB[]) {
        const provinceColorToTargetColor = new Map<RGB, RGB>();
        for (let province of this.game.getProvinces()) {
            const provinceColorCode = province.getColorCode();
            const targetColor = provinceId2Color.get(province.getId())!;
            provinceColorToTargetColor.set(provinceColorCode, targetColor);
        }
        const canvas = await MapUtil.drawMap(provinceColorToTargetColor, interestingColors);
        const {popupCover, popup} = AppWrapper.getPopupContainer();
        canvas.style.maxWidth = "calc(100vw - 200px)";
        canvas.style.maxHeight = "auto";
        popup.appendChild(canvas);
    }

    private downloadAsJson() {
        if (this.lobby != null) {
            const data = this.lobby!.getEntries().map(e => e.toSendable());
            const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.lobby!.login.name + "_" + new Date().toISOString() + ".json";
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    }
}