import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import {
  ModalController,
  ActionSheetController,
  AlertController
} from '@ionic/angular';
import { MapmodalComponent } from '../../mapmodal/mapmodal.component';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Plugins, Capacitor } from '@capacitor/core';

import { environment } from '../../../../environments/environment';
import { PlaceLocation, Coordinates } from 'src/app/places/location.interface';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss']
})
export class LocationPickerComponent implements OnInit {
  @Output() locationChange = new EventEmitter<PlaceLocation>();
  @Input() staticGoogleMapsUrl: string;

  @Input() selectedPlace: PlaceLocation = {
    lat: -34.397,
    lng: 150.644,
    address: 'Pick Location',
    staticMapImageUrl: null
  };
  @Input() editMode = false;
  // @Input() showPreview = false;

  isLoading = false;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  openActionSheet() {
    this.actionSheetCtrl
      .create({
        header: 'Please Select One',
        buttons: [
          { text: 'Auto Locate', handler: () => this.autoLocateUser() },
          { text: 'Manually Pick', handler: () => this.openMapModel() },
          { text: 'Cancel', role: 'cancel' }
        ]
      })
      .then(actionSheetEl => {
        actionSheetEl.present();
      });
  }

  private autoLocateUser() {
    if (!Capacitor.isPluginAvailable('Geolocation')) {
      this.showFailedToFetchLocation();
      return;
    }
    Plugins.Geolocation.getCurrentPosition()
      .then(position => {
        this.isLoading = true;

        const coordinates: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const pickedLocation: PlaceLocation = {
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: null,
          staticMapImageUrl: null
        };

        this.reverseGeoCoding(coordinates.lat, coordinates.lng)
          .pipe(
            switchMap((address: string) => {
              pickedLocation.address = address;
              return of(
                this.getStaticMapImage(coordinates.lat, coordinates.lng, 14)
              );
            })
          )
          .subscribe((staticImageUrl: string) => {
            this.staticGoogleMapsUrl = staticImageUrl;
            console.log(staticImageUrl);
            pickedLocation.staticMapImageUrl = staticImageUrl;
            console.log(pickedLocation);
            this.isLoading = false;
            // fire the locationChange Event to push pickedLocation data to the new place form
            this.locationChange.emit(pickedLocation);
          });
      })
      .catch(err => {
        this.isLoading = false;
        this.showFailedToFetchLocation();
      });
  }

  private showFailedToFetchLocation() {
    this.alertCtrl
      .create({
        header: 'Failed to fetch location',
        message:
          'Could not able to fetch the current location of the device, Make sure you have enabled it for this application',
        buttons: ['Okay']
      })
      .then(alertEl => alertEl.present());
  }

  private openMapModel() {
    this.modalCtrl
      .create({
        component: MapmodalComponent,
        componentProps: {
          lat: this.selectedPlace.lat,
          lng: this.selectedPlace.lng,
          address: this.selectedPlace.address,
          editMode: this.editMode
        }
      })
      .then(modalEl => {
        modalEl.present();
        modalEl.onDidDismiss().then(modalData => {
          if (modalData.role === 'picked') {
            this.isLoading = true;
            const pickedLocation: PlaceLocation = {
              lat: modalData.data.lat,
              lng: modalData.data.lng,
              address: null,
              staticMapImageUrl: null
            };
            console.log(modalData.data);
            this.reverseGeoCoding(modalData.data.lat, modalData.data.lng)
              .pipe(
                switchMap((address: string) => {
                  pickedLocation.address = address;
                  return of(
                    this.getStaticMapImage(
                      modalData.data.lat,
                      modalData.data.lng,
                      14
                    )
                  );
                })
              )
              .subscribe((staticImageUrl: string) => {
                this.staticGoogleMapsUrl = staticImageUrl;
                console.log(staticImageUrl);
                pickedLocation.staticMapImageUrl = staticImageUrl;
                console.log(pickedLocation);
                this.isLoading = false;
                console.log(this.isLoading, ' ISLOADING');
                // fire the locationChange Event to push pickedLocation data to the new place form
                this.locationChange.emit(pickedLocation);
              });
          }
        });
      });
  }

  private reverseGeoCoding(lat: number, lng: number) {
    // reverse GeoCoding is the process of getting address from latitude and longitude.
    // this is using mapbox, mapbox uses longitude first and latitude after while
    // google uses latitude first and longitude after
    return this.http
      .get<any>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${
          environment.mapBoxKey
        }`
      )
      .pipe(
        map(response => {
          if (
            !response ||
            !response.features ||
            response.features.length <= 0
          ) {
            return null;
          }
          return response.features[0].place_name;
        })
      );
  }

  private getStaticMapImage(lat: number, lng: number, zoom: number) {
    // google maps way
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=500x300&maptype=roadmap&markers=color:blue%7Clabel:Place%7C${lat},${lng}&key=${
      environment.googleMapsKey
    }`;
  }
}
