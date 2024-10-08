import * as L from 'leaflet';
import { ITabApp } from "../../ui/ITabApp";
import { Constants } from '../../Constants';
import { Game } from '../../model/Game';
import { ImageUtil, RGB } from '../../util/ImageUtil';

export class MapSelect implements ITabApp {

    private panel: HTMLDivElement;
    private game: Game;

    private canvas: HTMLCanvasElement;
    private referenceCanvas: HTMLCanvasElement;

    constructor(game: Game) {
        this.game = game;
        const imageUrl = Constants.getGfx('provinces.png');
        const imgSize = [5632, 2048];
        this.panel = document.createElement('div');
        this.panel.classList.add("map");
        const imageBounds: L.LatLngBoundsExpression = [[0, 0], [imgSize[1], imgSize[0]]];
        const map = L.map(this.panel, {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 4,
        });
        map.zoomControl.remove();
        //
        this.canvas = ImageUtil.imageToCanvas(imageUrl, new Map(), (canvas) => {
            L.imageOverlay(canvas.toDataURL(), imageBounds).addTo(map);
            map.fitBounds(imageBounds);
            this.panel.style.backgroundColor = "var(--main-color)";
            map.setView([imgSize[1] / 2, imgSize[0]  /2], 0);
        });
        this.referenceCanvas = ImageUtil.imageToCanvas(imageUrl, new Map<RGB,RGB>, (canvas) => {});
        const xyToLatLng = (x: number, y: number) => {
            return { lat: imgSize[1] - y, lng: x };
        }
        const clickyClicky = (latLng: L.LatLng, x: number, y: number) => {
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });
            const originalRGBA = this.referenceCanvas.getContext('2d')!.getImageData(x, y, 1, 1).data;
            const mean = ImageUtil.findMeanCoordinates(this.referenceCanvas, new RGB(originalRGBA[0], originalRGBA[1], originalRGBA[2]));
            const provinceId = this.game.provinceColorToId(new RGB(originalRGBA[0], originalRGBA[1], originalRGBA[2]));
            let markerText = ""
            if (this.game.isLandProvinceId(provinceId)) {
                const province = this.game.getProvinceById(provinceId);
                markerText = province.getAlias() + "<br>" + (province.is1444Owned() ? "Owner: " + game.getTagAlias(province.get1444OwnerTag()) : "");   
            } else {
                markerText = "Water Province (" + provinceId + ")";
            }
            const markerLatLng = xyToLatLng(mean[0], mean[1]);
            const marker = L.marker(markerLatLng).addTo(map);
            marker.bindPopup(markerText).openPopup();
            map.eachLayer((layer) => {
                if (layer instanceof L.ImageOverlay) {
                    layer.setUrl(this.canvas.toDataURL());
                }
            });
            Array.from(document.getElementsByClassName("leaflet-popup-content")).forEach(element => {
                (element as HTMLElement).style.color = "black"; 
            });
        };
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            const point = { x: lng, y: imgSize[1] - lat };
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            clickyClicky(e.latlng, x, y);
        });
    }

    private setup() {

    }

    getPanel(): HTMLDivElement {
        return this.panel;
    }
}