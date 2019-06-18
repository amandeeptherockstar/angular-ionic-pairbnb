import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { PlacesService } from '../../places.service';
import { Place } from '../../place.model';
import { Subscription } from 'rxjs';
import { LoadingController, AlertController } from '@ionic/angular';
import { PlaceLocation } from '../../location.interface';
import { base64toBlob } from '../new-offer/base64ToBlob.utility';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss']
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  placeId: string;
  form: FormGroup;
  googleStaticMapsImageUrl: string;
  locationData: PlaceLocation;

  private placeSubscription: Subscription;
  isLoading = false;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private route: ActivatedRoute,
    private alertCtrl: AlertController
  ) {}

  get title() {
    return this.form.get('title');
  }
  get description() {
    return this.form.get('description');
  }
  get price() {
    return this.form.get('price');
  }
  get dateFrom() {
    return this.form.get('dateFrom');
  }
  get dateTo() {
    return this.form.get('dateTo');
  }

  ngOnInit() {
    // here we have no chance of rendering this page from within page, so url cannot be changed
    // from within, so we use snapshot instead of paramMap.subscribe
    this.isLoading = true;
    this.placeId = this.route.snapshot.params['placeId'];
    this.placeSubscription = this.placesService
      .getPlace(this.placeId)
      .subscribe(
        (place: Place) => {
          this.place = place;

          this.form = new FormGroup({
            title: new FormControl(this.place.title, {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            description: new FormControl(this.place.description, {
              updateOn: 'blur',
              validators: [Validators.required, Validators.maxLength(140)]
            }),
            price: new FormControl(this.place.price, {
              updateOn: 'blur',
              validators: [Validators.required, Validators.min(1)]
            }),
            dateFrom: new FormControl(this.place.availableFrom.toISOString(), {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            dateTo: new FormControl(this.place.availableTo.toISOString(), {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            location: new FormControl(this.place.location, {
              validators: [Validators.required]
            }),
            image: new FormControl(this.place.imageUrl, {
              validators: [Validators.required]
            })
          });
          this.googleStaticMapsImageUrl = this.place.location.staticMapImageUrl;
          this.locationData = this.place.location;
          this.isLoading = false;
        },
        err => {
          this.alertCtrl
            .create({
              header: 'Something went wrong!',
              message: 'Place could not be fetched, Please try again!',
              buttons: [
                {
                  text: 'Okay',
                  handler: () => this.router.navigateByUrl('places/tabs/offers')
                }
              ]
            })
            .then(alertEl => {
              // this.isLoading = false;
              alertEl.present();
            });
        }
      );
  }

  onEditOffer() {
    if (!this.form.valid) {
      return;
    }

    this.loadingCtrl
      .create({
        message: 'Updating Place Offer...'
      })
      .then(loadingEl => {
        loadingEl.present();

        const {
          title,
          description,
          image,
          price,
          dateFrom,
          dateTo,
          location
        } = this.form.value;

        // upload the image if its a File otherwise, if its a string dont upload as the image is already there
        let serverImageUrl: string;
        let serverImagePath: string;
        let resizedImageUrl: string;
        let resizedImagePath: string;

        if (typeof this.form.value.image === 'string') {
          // dont delete the file
          // dont upload the file
          serverImageUrl = this.place.imageUrl;
          serverImagePath = this.place.serverImagePath;
          resizedImageUrl = this.place.resizedImageUrl;
          resizedImagePath = this.place.resizedImagePath;

          this.placesService
            .updatePlace(
              this.place.id,
              title,
              description,
              serverImageUrl,
              +price,
              new Date(dateFrom),
              new Date(dateTo),
              location,
              serverImagePath,
              resizedImageUrl,
              resizedImagePath
            )
            .subscribe(() => {
              this.form.reset();
              loadingEl.dismiss();
              this.router.navigateByUrl('/places/tabs/offers');
            });
        } else {
          // delete the file: we will make sure of this logic after
          this.placesService
            .deleteImage(
              this.place.serverImagePath,
              this.place.resizedImagePath
            )
            .pipe(
              switchMap(() => {
                // upload the file first
                return this.placesService.uploadImage(this.form.value.image);
              }),
              switchMap(firebaseResponse => {
                serverImageUrl = firebaseResponse.imageUrl.normal;
                serverImagePath = firebaseResponse.imageUrl.normal_fileName;
                resizedImageUrl = firebaseResponse.imageUrl.small;
                resizedImagePath = firebaseResponse.imageUrl.small_fileName;
                return this.placesService.updatePlace(
                  this.place.id,
                  title,
                  description,
                  serverImageUrl,
                  +price,
                  new Date(dateFrom),
                  new Date(dateTo),
                  location,
                  serverImagePath,
                  resizedImageUrl,
                  resizedImagePath
                );
              })
            )
            .subscribe(() => {
              this.form.reset();
              loadingEl.dismiss();
              this.router.navigateByUrl('/places/tabs/offers');
            });
        }
      });
  }

  onLocationChange(location: PlaceLocation) {
    // set the location data manually
    this.form.patchValue({
      location
    });
  }

  ngOnDestroy() {
    if (this.placeSubscription) {
      this.placeSubscription.unsubscribe();
    }
  }

  onImagePicked(imageData: string | File) {
    let image;
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/jpeg')) {
        // base64 image, so need to convert it to a File
        try {
          image = base64toBlob(
            imageData.replace('data:image/jpeg;base64,', ''),
            'image/jpeg'
          );
        } catch (e) {
          console.log(e);
          return;
        }
      } else {
        // its a normal string so patch it normally
        image = imageData;
      }
    } else {
      // normal file
      image = imageData;
    }

    this.form.patchValue({
      image
    });

    console.log(this.form);
  }
}
