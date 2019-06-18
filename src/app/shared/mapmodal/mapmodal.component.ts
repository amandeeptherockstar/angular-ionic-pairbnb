import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  OnDestroy,
  Input
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Coordinates, PlaceLocation } from 'src/app/places/location.interface';

@Component({
  selector: 'app-mapmodal',
  templateUrl: './mapmodal.component.html',
  styleUrls: ['./mapmodal.component.scss']
})
export class MapmodalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map') mapElementRef: ElementRef;
  @Input() lat: number = -34.397;
  @Input() lng: number = 150.644;
  @Input() address: string = 'Pick Location';

  @Input() editMode = false;
  @Input() viewOnlyMode = false;

  googleMapsRef: any;
  mapClickListener: any;

  constructor(
    private modalCtrl: ModalController,
    private renderer: Renderer2
  ) {}

  ngOnInit() {}

  closeModal() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  ngAfterViewInit() {
    this.openGoogleMaps()
      .then((GoogleMaps: any) => {
        this.googleMapsRef = GoogleMaps;
        const map = new GoogleMaps.Map(this.mapElementRef.nativeElement, {
          // center: { lat: -34.397, lng: 150.644 },
          center: {
            lat: this.lat,
            lng: this.lng
          },
          zoom: this.editMode || this.viewOnlyMode ? 14 : 8
        });

        // add class when the GoogleMaps is loaded
        GoogleMaps.event.addListenerOnce(map, 'idle', () => {
          this.renderer.addClass(this.mapElementRef.nativeElement, 'visible');
        });

        // add the click listener if the staticMapImageUrl = null, that means we are creating new offer
        if (!this.viewOnlyMode && !this.editMode) {
          console.log('NEW OFFER MODE');
          // add click listener on the map
          this.mapClickListener = map.addListener('click', event => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const selectedCoords = {
              lat,
              lng
            };
            console.log(selectedCoords);
            this.modalCtrl.dismiss(selectedCoords, 'picked');
          });
        } else if (!this.viewOnlyMode && this.editMode) {
          console.log('EDIT OFFER MODE');
          // if view only is false and pickedLocation is set we are in the edit mode
          // add click listener on the map
          this.mapClickListener = map.addListener('click', event => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const selectedCoords = {
              lat,
              lng
            };
            console.log(selectedCoords);
            this.modalCtrl.dismiss(selectedCoords, 'picked');
          });

          // add marker too
          const marker = new GoogleMaps.Marker({
            position: {
              lat: this.lat,
              lng: this.lng
            },
            map,
            title: 'Picked Location'
          });
          // set the marker on the map
          marker.setMap(map);
        } else {
          console.log('VIEW ONLY MODE');
          // just add the marker without adding any listener
          // add marker too
          const marker = new GoogleMaps.Marker({
            position: {
              lat: this.lat,
              lng: this.lng
            },
            map,
            title: 'Picked Location'
          });
          // set the marker on the map
          marker.setMap(map);
        }
      })
      .catch(e => console.log(e));
  }

  ngOnDestroy() {
    if (this.mapClickListener) {
      this.googleMapsRef.event.removeListener(this.mapClickListener);
    }
  }

  private openGoogleMaps(): Promise<any> {
    const win = window as any;
    const googleModule = win.google;

    if (googleModule && googleModule.maps) {
      return Promise.resolve(googleModule.maps);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://maps.googleapis.com/maps/api/js';
      script.async = true;
      script.defer = true;

      document.body.appendChild(script);
      script.onload = () => {
        const loadedGoogleModule = win.google;
        if (loadedGoogleModule && loadedGoogleModule.maps) {
          resolve(loadedGoogleModule.maps);
        } else {
          reject('Google Module Cannot be Loaded');
        }
      };
    });
  }
}
